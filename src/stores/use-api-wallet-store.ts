import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";

export type HyperliquidEnv = "mainnet" | "testnet";

const privateKeySchema = z
	.string()
	.regex(/^0x[0-9a-fA-F]{64}$/)
	.transform((v) => v.toLowerCase() as `0x${string}`);

const publicKeySchema = z
	.string()
	.regex(/^0x[0-9a-fA-F]{40}$/)
	.transform((v) => v.toLowerCase() as `0x${string}`);

const agentWalletSchema = z.object({
	privateKey: privateKeySchema,
	publicKey: publicKeySchema,
});

export type AgentWallet = z.infer<typeof agentWalletSchema>;

function getStorageKey(env: HyperliquidEnv, userAddress: string): string {
	return `hyperliquid_agent_${env}_${userAddress.toLowerCase()}`;
}

function readAgent(env: HyperliquidEnv, userAddress: string): AgentWallet | null {
	if (typeof window === "undefined") return null;

	try {
		const key = getStorageKey(env, userAddress);
		const raw = localStorage.getItem(key);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		return agentWalletSchema.parse(parsed);
	} catch {
		return null;
	}
}

function writeAgent(env: HyperliquidEnv, userAddress: string, privateKey: string, publicKey: string): void {
	if (typeof window === "undefined") return;

	try {
		const key = getStorageKey(env, userAddress);
		const data: AgentWallet = {
			privateKey: privateKeySchema.parse(privateKey),
			publicKey: publicKeySchema.parse(publicKey),
		};
		localStorage.setItem(key, JSON.stringify(data));
		window.dispatchEvent(new StorageEvent("storage", { key }));
	} catch (error) {
		console.error("[AgentStore] Failed to write:", error);
	}
}

function removeAgent(env: HyperliquidEnv, userAddress: string): void {
	if (typeof window === "undefined") return;

	const key = getStorageKey(env, userAddress);
	localStorage.removeItem(key);
	window.dispatchEvent(new StorageEvent("storage", { key }));
}

function subscribeToStorage(callback: () => void): () => void {
	const handleStorage = () => callback();
	window.addEventListener("storage", handleStorage);
	return () => window.removeEventListener("storage", handleStorage);
}

export function useAgentWallet(env: HyperliquidEnv, userAddress: string | undefined): AgentWallet | null {
	const getSnapshot = useCallback(() => {
		if (!userAddress) return null;
		return readAgent(env, userAddress);
	}, [env, userAddress]);

	const agent = useSyncExternalStore(
		subscribeToStorage,
		() => {
			const data = getSnapshot();
			return data ? JSON.stringify(data) : null;
		},
		() => null,
	);

	return agent ? (JSON.parse(agent) as AgentWallet) : null;
}

export function useAgentWalletActions() {
	const setAgent = useCallback(
		(env: HyperliquidEnv, userAddress: string, privateKey: string, publicKey: string) => {
			writeAgent(env, userAddress, privateKey, publicKey);
		},
		[],
	);

	const clearAgent = useCallback((env: HyperliquidEnv, userAddress: string) => {
		removeAgent(env, userAddress);
	}, []);

	return { setAgent, clearAgent };
}
