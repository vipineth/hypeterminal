// ============================================================================
// Types (Single Source of Truth)
// ============================================================================

export type {
	TradingStatus,
	SigningMode,
	AgentStatus,
	AgentRegisterStatus,
	BuilderConfig,
	HyperliquidEnv,
} from "./types";

// ============================================================================
// Context & Provider
// ============================================================================

export {
	type SigningModeContextValue,
	type SigningModeProviderProps,
	SigningModeProvider,
	useSigningModeContext,
	useSigningModeContextOptional,
} from "./SigningModeContext";

// ============================================================================
// Action Hooks (State-Changing Operations)
// ============================================================================

export {
	// Types
	type ActionHookResult,
	type ActionMutationOptions,
	ActionNotReadyError,

	// Core Trading
	useActionOrder,
	useActionCancel,
	useActionCancelByCloid,
	useActionModify,
	useActionBatchModify,
	useActionScheduleCancel,

	// TWAP
	useActionTwapOrder,
	useActionTwapCancel,

	// Position Management
	useActionUpdateLeverage,
	useActionUpdateIsolatedMargin,
} from "./useActionHooks";

// ============================================================================
// Agent Storage (Low-Level)
// ============================================================================

export {
	type AgentWallet,
	readAgentFromStorage,
	writeAgentToStorage,
	removeAgentFromStorage,
	useAgentWallet,
	useAgentWalletActions,
} from "./useAgentStore";

// ============================================================================
// Trading Agent (Low-Level)
// ============================================================================

export {
	type UseTradingAgentParams,
	type UseTradingAgentResult,
	isAgentApproved,
	useTradingAgent,
} from "./useTradingAgent";
