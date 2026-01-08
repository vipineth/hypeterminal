import type { ExtraAgentsResponse } from "@nktkas/hyperliquid";
import { useCallback, useMemo, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useExchangeApproveAgent } from "../exchange/useExchangeApproveAgent";
import { useInfoExtraAgents } from "../info/useInfoExtraAgents";
import type { AgentRegisterStatus, AgentStatus, HyperliquidEnv } from "./types";
import { type AgentWallet, useAgentWallet, useAgentWalletActions } from "./useAgentStore";

// Re-export types for convenience
export type { AgentRegisterStatus as RegisterStatus, AgentStatus } from "./types";

export interface UseTradingAgentParams {
	/** User's wallet address */
	user: `0x${string}` | undefined;
	/** Environment (mainnet/testnet) */
	env: HyperliquidEnv;
	/** Name to register the agent with (default: "HypeTerminal") */
	agentName?: string;
}

export interface UseTradingAgentResult {
	/** Current agent validation status */
	status: AgentStatus;
	/** Registration flow status */
	registerStatus: AgentRegisterStatus;
	/** Stored agent wallet (privateKey + publicKey) */
	agentWallet: AgentWallet | null;
	/** viem Account for signing (only when status is "valid") */
	signer: ReturnType<typeof privateKeyToAccount> | null;
	/** Register a new agent (generates keypair, approves on-chain) */
	registerAgent: () => Promise<`0x${string}`>;
	/** Clear the stored agent */
	resetAgent: () => void;
	/** Refetch extra agents to verify status */
	refetch: () => Promise<unknown>;
	/** Whether the agent is ready for trading */
	isReady: boolean;
	/** Error from registration (if any) */
	error: Error | null;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if an agent is in the extraAgents list and not expired.
 */
export function isAgentApproved(extraAgents: ExtraAgentsResponse | undefined, publicKey: string | undefined): boolean {
	if (!extraAgents || !publicKey) return false;

	const normalizedKey = publicKey.toLowerCase();
	const now = Date.now();

	return extraAgents.some((agent) => {
		const matches = agent.address.toLowerCase() === normalizedKey;
		const notExpired = agent.validUntil > now;
		return matches && notExpired;
	});
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages trading agent lifecycle for fast order signing.
 *
 * The agentic pattern allows signing orders with a locally-stored private key
 * instead of requiring wallet signatures for every transaction.
 *
 * Flow:
 * 1. User calls registerAgent()
 * 2. A new keypair is generated and stored in localStorage
 * 3. The public key is approved on Hyperliquid (requires wallet signature)
 * 4. Subsequent trades can use the agent signer (instant, no popups)
 *
 * @example
 * ```tsx
 * const { status, signer, registerAgent, isReady } = useTradingAgent({
 *   user: address,
 *   env: "mainnet",
 * });
 *
 * // Check if agent is ready
 * if (status === "no_agent") {
 *   return <button onClick={registerAgent}>Enable Fast Trading</button>;
 * }
 *
 * // Use signer for trades
 * if (isReady && signer) {
 *   // Pass signer to exchange operations
 * }
 * ```
 */
export function useTradingAgent(params: UseTradingAgentParams): UseTradingAgentResult {
	const { user, env, agentName = "HypeTerminal" } = params;

	// Agent wallet from localStorage
	const agentWallet = useAgentWallet(env, user);
	const { setAgent, clearAgent } = useAgentWalletActions();

	// Extra agents from Hyperliquid API
	const {
		data: extraAgents,
		isLoading: isLoadingAgents,
		refetch,
	} = useInfoExtraAgents(
		{ user: user ?? "0x0000000000000000000000000000000000000000" },
		{
			enabled: !!user,
			staleTime: 5_000,
			refetchInterval: 30_000,
		},
	);

	// Approve agent mutation
	const { mutateAsync: approveAgent } = useExchangeApproveAgent();

	// Local state
	const [registerStatus, setRegisterStatus] = useState<AgentRegisterStatus>("idle");
	const [error, setError] = useState<Error | null>(null);

	// Computed status
	const status: AgentStatus = useMemo(() => {
		if (!user) return "no_agent";
		if (isLoadingAgents) return "loading";
		if (!agentWallet) return "no_agent";

		const isValid = isAgentApproved(extraAgents, agentWallet.publicKey);
		return isValid ? "valid" : "invalid";
	}, [user, isLoadingAgents, agentWallet, extraAgents]);

	// Create signer from private key (only when valid)
	const signer = useMemo(() => {
		if (status !== "valid" || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [status, agentWallet?.privateKey]);

	// Register new agent
	const registerAgent = useCallback(async (): Promise<`0x${string}`> => {
		if (!user) throw new Error("No user address");

		setError(null);

		try {
			setRegisterStatus("signing");

			// Clear existing agent
			clearAgent(env, user);

			// Generate new keypair
			const privateKey = generatePrivateKey();
			const account = privateKeyToAccount(privateKey);
			const publicKey = account.address;

			// Save to localStorage first
			setAgent(env, user, privateKey, publicKey);

			// Approve on Hyperliquid (this triggers wallet signature)
			await approveAgent({
				agentAddress: publicKey,
				agentName,
			});

			// Verify approval
			setRegisterStatus("verifying");
			const { data } = await refetch();

			if (!isAgentApproved(data, publicKey)) {
				throw new Error("Agent verification failed - not found in extraAgents");
			}

			setRegisterStatus("idle");
			return publicKey;
		} catch (err) {
			setRegisterStatus("error");
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			throw error;
		}
	}, [user, env, agentName, clearAgent, setAgent, approveAgent, refetch]);

	// Reset agent
	const resetAgent = useCallback(() => {
		if (user) {
			clearAgent(env, user);
		}
		setRegisterStatus("idle");
		setError(null);
	}, [user, env, clearAgent]);

	return {
		status,
		registerStatus,
		agentWallet,
		signer,
		registerAgent,
		resetAgent,
		refetch,
		isReady: status === "valid" && !!signer,
		error,
	};
}
