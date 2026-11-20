import { removeAgentFromStorage } from "@hypeterminal/hl-react";
import { ChainNotConfiguredError, ConnectorNotConnectedError } from "@wagmi/core";
import {
	type Address,
	type EIP1193RequestFn,
	getAddress,
	numberToHex,
	SwitchChainError,
	UnsupportedProviderMethodError,
} from "viem";
import { createConnector } from "wagmi";
import { z } from "zod";
import { STORAGE_KEYS } from "@/config/app";

export const PHONE_LINK_CONNECTOR_ID = "phoneLink";

const MAIN_WALLET_REQUIRED = "Switch to desktop to use your main wallet";

const sessionSchema = z.object({
	address: z
		.string()
		.regex(/^0x[0-9a-fA-F]{40}$/)
		.transform((value) => value.toLowerCase() as Address),
	env: z.enum(["Mainnet", "Testnet"]),
});

export type PhoneLinkSession = z.output<typeof sessionSchema>;

export function readPhoneLinkSession(): PhoneLinkSession | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.PHONE_LINK);
		if (!raw) return null;
		const parsed = sessionSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function writePhoneLinkSession(session: PhoneLinkSession): void {
	localStorage.setItem(STORAGE_KEYS.PHONE_LINK, JSON.stringify(session));
}

function clearPhoneLinkSession(): void {
	const session = readPhoneLinkSession();
	if (session) removeAgentFromStorage(session.env, session.address);
	localStorage.removeItem(STORAGE_KEYS.PHONE_LINK);
}

function linkedAccounts(): Address[] {
	const session = readPhoneLinkSession();
	return session ? [getAddress(session.address)] : [];
}

interface Provider {
	request: EIP1193RequestFn;
	on: () => void;
	removeListener: () => void;
}

export function phoneLink() {
	let chainId: number | undefined;

	return createConnector<Provider>((config) => {
		function currentChainId() {
			return chainId ?? config.chains[0].id;
		}

		const provider: Provider = {
			request: (async ({ method }: { method: string }) => {
				if (method === "eth_accounts" || method === "eth_requestAccounts") return linkedAccounts();
				if (method === "eth_chainId") return numberToHex(currentChainId());
				throw new UnsupportedProviderMethodError(new Error(MAIN_WALLET_REQUIRED));
			}) as EIP1193RequestFn,
			on() {},
			removeListener() {},
		};

		return {
			id: PHONE_LINK_CONNECTOR_ID,
			name: "Phone link",
			type: PHONE_LINK_CONNECTOR_ID,
			async connect({ chainId: requestedChainId, withCapabilities } = {}) {
				const accounts = linkedAccounts();
				if (accounts.length === 0) throw new ConnectorNotConnectedError();
				if (requestedChainId) chainId = requestedChainId;
				return {
					accounts: (withCapabilities ? accounts.map((address) => ({ address, capabilities: {} })) : accounts) as never,
					chainId: currentChainId(),
				};
			},
			async disconnect() {
				clearPhoneLinkSession();
			},
			async getAccounts() {
				return linkedAccounts();
			},
			async getChainId() {
				return currentChainId();
			},
			async getProvider() {
				return provider;
			},
			async isAuthorized() {
				return readPhoneLinkSession() !== null;
			},
			async switchChain({ chainId: nextChainId }) {
				const chain = config.chains.find((candidate) => candidate.id === nextChainId);
				if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());
				chainId = nextChainId;
				config.emitter.emit("change", { chainId: nextChainId });
				return chain;
			},
			onAccountsChanged(accounts) {
				if (accounts.length === 0) this.onDisconnect();
				else config.emitter.emit("change", { accounts: accounts.map((account) => getAddress(account)) });
			},
			onChainChanged(chain) {
				config.emitter.emit("change", { chainId: Number(chain) });
			},
			onDisconnect() {
				config.emitter.emit("disconnect");
			},
		};
	});
}
