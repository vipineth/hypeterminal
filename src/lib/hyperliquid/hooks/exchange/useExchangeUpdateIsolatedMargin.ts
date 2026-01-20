import type {
	ExchangeClient,
	UpdateIsolatedMarginParameters,
	UpdateIsolatedMarginSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUpdateIsolatedMarginMutationOptions(exchange)));
}
