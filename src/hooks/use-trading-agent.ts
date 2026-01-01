import { useCallback, useMemo } from "react";
import { privateKeyToAccount } from "viem/accounts";
import type { WalletClient } from "viem";
import { useExtraAgents } from "@/hooks/hyperliquid/use-extra-agents";
import { createApiWalletSigner, generateApiWalletPrivateKey } from "@/lib/hyperliquid/api-wallet";
import {
	approveApiWallet,
	getHttpTransport,
	isAgentApproved,
	makeExchangeConfig,
	toHyperliquidWallet,
} from "@/lib/hyperliquid";
import {
	useApiWalletActions,
	useApiWalletPrivateKeyByEnv,
	type HyperliquidEnv,
} from "@/stores/use-api-wallet-store";

const HYPERLIQUID_ENV: HyperliquidEnv = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "testnet" : "mainnet";

interface UseTradingAgentParams {
	user: `0x${string}` | undefined;
	walletClient: WalletClient | undefined;
	enabled?: boolean;
}

export function useTradingAgent(params: UseTradingAgentParams) {
	const { user, walletClient, enabled = true } = params;
	const privateKeyByEnv = useApiWalletPrivateKeyByEnv();
	const { setPrivateKey } = useApiWalletActions();

	// Get or generate API wallet private key
	const apiWalletPrivateKey = useMemo(() => {
		return privateKeyByEnv[HYPERLIQUID_ENV];
	}, [privateKeyByEnv]);

	// Derive the agent address from private key
	const agentAddress = useMemo(() => {
		if (!apiWalletPrivateKey) return null;
		try {
			const account = privateKeyToAccount(apiWalletPrivateKey);
			return account.address;
		} catch {
			return null;
		}
	}, [apiWalletPrivateKey]);

	// Query extra agents to check approval status
	const { data: extraAgents, refetch: refetchAgents } = useExtraAgents({
		user,
		enabled: enabled && !!user,
	});

	// Check if agent is approved
	const isApproved = useMemo(() => {
		if (!agentAddress || !extraAgents) return false;
		return isAgentApproved(extraAgents, agentAddress);
	}, [extraAgents, agentAddress]);

	// Get the API wallet signer (only if approved)
	const apiWalletSigner = useMemo(() => {
		if (!apiWalletPrivateKey || !isApproved) return null;
		return createApiWalletSigner(apiWalletPrivateKey);
	}, [apiWalletPrivateKey, isApproved]);

	// Generate API wallet if not exists
	const ensureApiWallet = useCallback(() => {
		if (apiWalletPrivateKey) return apiWalletPrivateKey;
		const newKey = generateApiWalletPrivateKey();
		setPrivateKey(HYPERLIQUID_ENV, newKey);
		return newKey;
	}, [apiWalletPrivateKey, setPrivateKey]);

	// Check if we can approve (wallet client ready)
	const canApprove = !!walletClient && !!user;

	// Approve the agent
	const approveAgent = useCallback(async () => {
		if (!walletClient) {
			throw new Error("Wallet client not ready. Please wait and try again.");
		}
		if (!user) {
			throw new Error("Wallet not connected");
		}

		// Ensure we have an API wallet
		const privateKey = ensureApiWallet();
		const account = privateKeyToAccount(privateKey);
		const agentAddr = account.address;

		// Create config with the connected wallet (not the agent)
		const wallet = toHyperliquidWallet(walletClient);
		if (!wallet) {
			throw new Error("Failed to create wallet");
		}

		const transport = getHttpTransport();
		const config = makeExchangeConfig(transport, wallet);

		// Approve the agent
		await approveApiWallet(config, {
			agentAddress: agentAddr,
			agentName: "HyperTerminal",
		});

		// Refetch agents to update approval status
		await refetchAgents();

		return agentAddr;
	}, [walletClient, user, ensureApiWallet, refetchAgents]);

	return {
		isApproved,
		agentAddress,
		apiWalletSigner,
		approveAgent,
		refetchAgents,
		canApprove,
	};
}
