import { t } from "@lingui/core/macro";
import { useCallback, useMemo, useState } from "react";
import type { WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { approveApiWallet, isAgentApproved, makeExchangeConfig } from "@/lib/hyperliquid/exchange";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import { type HyperliquidEnv, useAgentWallet, useAgentWalletActions } from "@/stores/use-api-wallet-store";
import { useExtraAgents } from "./use-extra-agents";

const HYPERLIQUID_ENV: HyperliquidEnv = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "testnet" : "mainnet";

export type AgentStatus = "loading" | "no_agent" | "valid" | "invalid";
export type RegisterStatus = "idle" | "signing" | "verifying" | "error";

interface UseTradingAgentParams {
	user: `0x${string}` | undefined;
	walletClient: WalletClient | undefined;
}

export function useTradingAgent(params: UseTradingAgentParams) {
	const { user, walletClient } = params;

	const agentWallet = useAgentWallet(HYPERLIQUID_ENV, user);
	const { setAgent, clearAgent } = useAgentWalletActions();
	const { agents: extraAgents, isLoading: isLoadingAgents, refetch } = useExtraAgents(user);

	const [registerStatus, setRegisterStatus] = useState<RegisterStatus>("idle");

	// Agent status: loading → no_agent → valid/invalid
	const status: AgentStatus = useMemo(() => {
		if (!user) return "no_agent";
		if (isLoadingAgents) return "loading";
		if (!agentWallet) return "no_agent";

		const isValid = isAgentApproved(extraAgents, agentWallet.publicKey);
		return isValid ? "valid" : "invalid";
	}, [user, isLoadingAgents, agentWallet, extraAgents]);

	// Signer account (only when valid)
	const signer = useMemo(() => {
		if (status !== "valid" || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [status, agentWallet?.privateKey]);

	// Register new agent
	const registerAgent = useCallback(async () => {
		if (!walletClient) throw new Error(t`Wallet not connected`);
		if (!user) throw new Error(t`No user address`);

		try {
			setRegisterStatus("signing");

			// Clear existing and generate new
			clearAgent(HYPERLIQUID_ENV, user);
			const privateKey = generatePrivateKey();
			const account = privateKeyToAccount(privateKey);
			const publicKey = account.address;

			// Save to localStorage
			setAgent(HYPERLIQUID_ENV, user, privateKey, publicKey);

			// Approve on Hyperliquid
			const wallet = toHyperliquidWallet(walletClient, user);
			if (!wallet) throw new Error(t`Could not create wallet`);

			const transport = getHttpTransport();
			const config = makeExchangeConfig(transport, wallet);
			await approveApiWallet(config, { agentAddress: publicKey, agentName: "HypeTerminal" });

			// Verify
			setRegisterStatus("verifying");
			const { data } = await refetch();
			if (!data || !isAgentApproved(data, publicKey)) {
				throw new Error(t`Agent verification failed`);
			}

			setRegisterStatus("idle");
			return publicKey;
		} catch (error) {
			setRegisterStatus("error");
			throw error;
		}
	}, [walletClient, user, clearAgent, setAgent, refetch]);

	// Reset agent
	const resetAgent = useCallback(() => {
		if (user) clearAgent(HYPERLIQUID_ENV, user);
		setRegisterStatus("idle");
	}, [user, clearAgent]);

	return {
		status,
		registerStatus,
		agentWallet,
		signer,
		registerAgent,
		resetAgent,
		refetch,
	};
}
