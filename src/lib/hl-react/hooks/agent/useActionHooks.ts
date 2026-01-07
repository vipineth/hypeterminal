import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { ExchangeClient, type IRequestTransport } from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import type {
	OrderParameters,
	OrderSuccessResponse,
	CancelParameters,
	CancelSuccessResponse,
	CancelByCloidParameters,
	CancelByCloidSuccessResponse,
	ModifyParameters,
	ModifySuccessResponse,
	BatchModifyParameters,
	BatchModifySuccessResponse,
	ScheduleCancelParameters,
	ScheduleCancelSuccessResponse,
	TwapOrderParameters,
	TwapOrderSuccessResponse,
	TwapCancelParameters,
	TwapCancelSuccessResponse,
	UpdateLeverageParameters,
	UpdateLeverageSuccessResponse,
	UpdateIsolatedMarginParameters,
	UpdateIsolatedMarginSuccessResponse,
} from "@nktkas/hyperliquid";
import { useHttpTransport } from "../useTransport";
import { useSigningModeContext } from "./SigningModeContext";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import type { TradingStatus, AgentRegisterStatus, SigningMode } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Base result type for all action hooks.
 */
export interface ActionHookResult<TData, TVariables> {
	// Mutation
	mutate: (variables: TVariables) => void;
	mutateAsync: (variables: TVariables) => Promise<TData>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: HyperliquidQueryError | null;
	data: TData | undefined;
	reset: () => void;

	// Trading status (from context)
	status: TradingStatus;
	isReady: boolean;
	signingMode: SigningMode;

	// Agent controls
	approve: () => Promise<`0x${string}`>;
	agentRegisterStatus: AgentRegisterStatus;
}

export type ActionMutationOptions<TData, TVariables> = MutationParameter<TData, TVariables>;

// ============================================================================
// Internal Hook
// ============================================================================

// Chain IDs for signature verification
const CHAIN_IDS = {
	mainnet: "0xa4b1" as const, // Arbitrum One
	testnet: "0x66eee" as const, // Arbitrum Sepolia
} as const;

/**
 * Internal hook that creates exchange client with active signer from context.
 */
function useActionExchangeClient() {
	const transport = useHttpTransport();
	const ctx = useSigningModeContext();

	const exchangeClient = useMemo(() => {
		if (!ctx.activeSigner || !transport) return null;
		try {
			return new ExchangeClient({
				transport: transport as IRequestTransport,
				wallet: ctx.activeSigner as AbstractWallet,
				signatureChainId: CHAIN_IDS[ctx.env],
			});
		} catch {
			return null;
		}
	}, [transport, ctx.activeSigner, ctx.env]);

	return { exchangeClient, ctx };
}

// ============================================================================
// Error
// ============================================================================

export class ActionNotReadyError extends Error {
	readonly status: TradingStatus;

	constructor(status: TradingStatus) {
		const messages: Record<TradingStatus, string> = {
			ready: "Ready to trade",
			no_wallet: "Please connect your wallet.",
			needs_approval: "Enable fast trading to continue.",
			no_signer: "No signer available.",
		};
		super(messages[status]);
		this.name = "ActionNotReadyError";
		this.status = status;
	}
}

// ============================================================================
// Core Trading Actions
// ============================================================================

/**
 * Place orders with automatic signer and builder fee injection.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, status, approve } = useActionOrder();
 *
 * if (status === "needs_approval") {
 *   return <button onClick={approve}>Enable Trading</button>;
 * }
 *
 * <button
 *   onClick={() => mutate({ orders: [...], grouping: "na" })}
 *   disabled={status !== "ready" || isPending}
 * >
 *   Place Order
 * </button>
 * ```
 */
export function useActionOrder(options: ActionMutationOptions<OrderSuccessResponse, OrderParameters> = {}) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("order"),
		mutationFn: async (params: OrderParameters) => {
			if (ctx.status !== "ready") {
				throw new ActionNotReadyError(ctx.status);
			}
			if (!exchangeClient) {
				throw new Error("Exchange client not available");
			}

			// Inject builder fee if configured
			const paramsWithBuilder: OrderParameters = ctx.builderConfig
				? {
						...params,
						builder: {
							b: ctx.builderConfig.address,
							f: ctx.builderConfig.feeRate,
						},
					}
				: params;

			return exchangeClient.order(paramsWithBuilder);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Cancel orders.
 */
export function useActionCancel(options: ActionMutationOptions<CancelSuccessResponse, CancelParameters> = {}) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("cancel"),
		mutationFn: async (params: CancelParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.cancel(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Cancel orders by client order ID.
 */
export function useActionCancelByCloid(
	options: ActionMutationOptions<CancelByCloidSuccessResponse, CancelByCloidParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("cancelByCloid"),
		mutationFn: async (params: CancelByCloidParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.cancelByCloid(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Modify an existing order.
 */
export function useActionModify(options: ActionMutationOptions<ModifySuccessResponse, ModifyParameters> = {}) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("modify"),
		mutationFn: async (params: ModifyParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.modify(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Batch modify multiple orders.
 */
export function useActionBatchModify(
	options: ActionMutationOptions<BatchModifySuccessResponse, BatchModifyParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("batchModify"),
		mutationFn: async (params: BatchModifyParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.batchModify(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Schedule order cancellation.
 */
export function useActionScheduleCancel(
	options: ActionMutationOptions<ScheduleCancelSuccessResponse, ScheduleCancelParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("scheduleCancel"),
		mutationFn: async (params: ScheduleCancelParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.scheduleCancel(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

// ============================================================================
// TWAP Actions
// ============================================================================

/**
 * Place a TWAP order.
 */
export function useActionTwapOrder(
	options: ActionMutationOptions<TwapOrderSuccessResponse, TwapOrderParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("twapOrder"),
		mutationFn: async (params: TwapOrderParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.twapOrder(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Cancel a TWAP order.
 */
export function useActionTwapCancel(
	options: ActionMutationOptions<TwapCancelSuccessResponse, TwapCancelParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("twapCancel"),
		mutationFn: async (params: TwapCancelParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.twapCancel(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

// ============================================================================
// Position Management Actions
// ============================================================================

/**
 * Update leverage for an asset.
 */
export function useActionUpdateLeverage(
	options: ActionMutationOptions<UpdateLeverageSuccessResponse, UpdateLeverageParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("updateLeverage"),
		mutationFn: async (params: UpdateLeverageParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.updateLeverage(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}

/**
 * Update isolated margin for a position.
 */
export function useActionUpdateIsolatedMargin(
	options: ActionMutationOptions<UpdateIsolatedMarginSuccessResponse, UpdateIsolatedMarginParameters> = {},
) {
	const { exchangeClient, ctx } = useActionExchangeClient();

	const mutation = useMutation({
		...options,
		mutationKey: exchangeKeys.method("updateIsolatedMargin"),
		mutationFn: async (params: UpdateIsolatedMarginParameters) => {
			if (ctx.status !== "ready") throw new ActionNotReadyError(ctx.status);
			if (!exchangeClient) throw new Error("Exchange client not available");
			return exchangeClient.updateIsolatedMargin(params);
		},
	});

	return {
		...mutation,
		status: ctx.status,
		isReady: ctx.isReady,
		signingMode: ctx.signingMode,
		approve: ctx.approve,
		agentRegisterStatus: ctx.agentRegisterStatus,
	};
}
