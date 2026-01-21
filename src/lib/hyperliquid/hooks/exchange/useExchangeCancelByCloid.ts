import type { CancelByCloidParameters, CancelByCloidSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type CancelByCloidData = CancelByCloidSuccessResponse;
type CancelByCloidParams = CancelByCloidParameters;

export type UseExchangeCancelByCloidOptions = MutationParameter<CancelByCloidData, CancelByCloidParams>;
export type UseExchangeCancelByCloidReturnType = UseMutationResult<
	CancelByCloidData,
	HyperliquidQueryError,
	CancelByCloidParams
>;

export function getCancelByCloidMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CancelByCloidData, CancelByCloidParams> {
	return {
		mutationKey: createMutationKey("cancelByCloid"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.cancelByCloid(params)),
	};
}

export function useExchangeCancelByCloid(
	options: UseExchangeCancelByCloidOptions = {},
): UseExchangeCancelByCloidReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCancelByCloidMutationOptions(trading)));
}
