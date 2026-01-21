import type {
	ExchangeClient,
	UpdateIsolatedMarginParameters,
	UpdateIsolatedMarginSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type UpdateIsolatedMarginData = UpdateIsolatedMarginSuccessResponse;
type UpdateIsolatedMarginParams = UpdateIsolatedMarginParameters;

export type UseExchangeUpdateIsolatedMarginOptions = MutationParameter<
	UpdateIsolatedMarginData,
	UpdateIsolatedMarginParams
>;
export type UseExchangeUpdateIsolatedMarginReturnType = UseMutationResult<
	UpdateIsolatedMarginData,
	HyperliquidQueryError,
	UpdateIsolatedMarginParams
>;

export function getUpdateIsolatedMarginMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<UpdateIsolatedMarginData, UpdateIsolatedMarginParams> {
	return {
		mutationKey: createMutationKey("updateIsolatedMargin"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.updateIsolatedMargin(params)),
	};
}

export function useExchangeUpdateIsolatedMargin(
	options: UseExchangeUpdateIsolatedMarginOptions = {},
): UseExchangeUpdateIsolatedMarginReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUpdateIsolatedMarginMutationOptions(trading)));
}
