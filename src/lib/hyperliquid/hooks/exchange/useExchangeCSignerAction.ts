import type { CSignerActionParameters, CSignerActionSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CSignerActionData = CSignerActionSuccessResponse;
type CSignerActionParams = CSignerActionParameters;

export type UseExchangeCSignerActionOptions = MutationParameter<CSignerActionData, CSignerActionParams>;
export type UseExchangeCSignerActionReturnType = UseMutationResult<
	CSignerActionData,
	HyperliquidQueryError,
	CSignerActionParams
>;

export function useExchangeCSignerAction(
	options: UseExchangeCSignerActionOptions = {},
): UseExchangeCSignerActionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cSignerAction"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cSignerAction(params);
		},
	});
}
