import type {
	ExchangeClient,
	UpdateIsolatedMarginParameters,
	UpdateIsolatedMarginSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface UpdateIsolatedMarginMutationContext {
	exchange: ExchangeClient | null;
}

export function getUpdateIsolatedMarginMutationOptions(
	context: UpdateIsolatedMarginMutationContext,
): MutationOptions<UpdateIsolatedMarginData, UpdateIsolatedMarginParams> {
	return {
		mutationKey: createMutationKey("updateIsolatedMargin"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.updateIsolatedMargin(params);
		},
	};
}

export function useExchangeUpdateIsolatedMargin(
	options: UseExchangeUpdateIsolatedMarginOptions = {},
): UseExchangeUpdateIsolatedMarginReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUpdateIsolatedMarginMutationOptions({ exchange })));
}
