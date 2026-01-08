// ============================================================================
// Trading Status (Single Source of Truth)
// ============================================================================

import type { OrderParameters } from "@nktkas/hyperliquid";

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
export type BuilderConfig = OrderParameters["builder"];

// ============================================================================
// Environment
// ============================================================================

export type HyperliquidEnv = "Mainnet" | "Testnet";
