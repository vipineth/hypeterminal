import type { WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useCallback, useMemo } from "react";
import { useExtraAgents } from "./use-extra-agents";
import { UI_TEXT } from "@/constants/app";
import { createApiWalletSigner, generateApiWalletPrivateKey } from "@/lib/hyperliquid/api-wallet";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { approveApiWallet, isAgentApproved, makeExchangeConfig } from "@/lib/hyperliquid/exchange";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import {
	useApiWalletActions,
	useApiWalletPrivateKeyByEnv,
	type HyperliquidEnv,
} from "@/stores/use-api-wallet-store";

const HYPERLIQUID_ENV: HyperliquidEnv = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "testnet" : "mainnet";
const TRADING_AGENT_TEXT = UI_TEXT.TRADING_AGENT;

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
			throw new Error(TRADING_AGENT_TEXT.ERROR_WALLET_CLIENT_NOT_READY);
		}
		if (!user) {
			throw new Error(TRADING_AGENT_TEXT.ERROR_WALLET_NOT_CONNECTED);
		}

		// Ensure we have an API wallet
		const privateKey = ensureApiWallet();
		const account = privateKeyToAccount(privateKey);
		const agentAddr = account.address;

		// Create config with the connected wallet (not the agent)
		const wallet = toHyperliquidWallet(walletClient);
		if (!wallet) {
			throw new Error(TRADING_AGENT_TEXT.ERROR_CREATE_WALLET);
		}

		const transport = getHttpTransport();
		const config = makeExchangeConfig(transport, wallet);

		// Approve the agent
		await approveApiWallet(config, {
			agentAddress: agentAddr,
			agentName: TRADING_AGENT_TEXT.AGENT_NAME,
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
