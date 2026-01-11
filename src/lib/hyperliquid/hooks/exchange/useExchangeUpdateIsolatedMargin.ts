import type { UpdateIsolatedMarginParameters, UpdateIsolatedMarginSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeUpdateIsolatedMargin(
	options: UseExchangeUpdateIsolatedMarginOptions = {},
): UseExchangeUpdateIsolatedMarginReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("updateIsolatedMargin"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.updateIsolatedMargin(params);
		},
	});
}
