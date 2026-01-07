// ============================================================================
// Trading Status (Single Source of Truth)
// ============================================================================

/**
 * Trading readiness status.
 *
 * - `ready`: Can execute trades
 * - `no_wallet`: Wallet not connected
 * - `needs_approval`: Agent mode selected, needs one-time approval
 * - `no_signer`: Signer unavailable (shouldn't happen normally)
 */
export type TradingStatus = "ready" | "no_wallet" | "needs_approval" | "no_signer";

/**
 * Signing mode for transactions.
 *
 * - `direct`: Every transaction requires wallet signature popup
 * - `agent`: Transactions signed instantly with locally-stored agent key
 */
export type SigningMode = "direct" | "agent";

/**
 * Agent registration status during the approval flow.
 */
export type AgentRegisterStatus = "idle" | "signing" | "verifying" | "error";

/**
 * Agent validation status.
 */
export type AgentStatus = "loading" | "no_agent" | "valid" | "invalid";

// ============================================================================
// Builder Fee Config
// ============================================================================

/**
 * Builder fee configuration for order placement.
 * Only applies to `order` operations.
 */
export type BuilderConfig = {
	/** Builder address */
	address: `0x${string}`;
	/** Fee rate in 0.1bps units (1 = 0.0001%). Max 100 for perps (0.1%), 1000 for spot (1%) */
	feeRate: number;
};

// ============================================================================
// Environment
// ============================================================================

export type HyperliquidEnv = "mainnet" | "testnet";
