import type { CSignerActionParameters, CSignerActionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

export function getCSignerActionMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CSignerActionData, CSignerActionParams> {
	return {
		mutationKey: createMutationKey("cSignerAction"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.cSignerAction(params);
		},
	};
}

export function useExchangeCSignerAction(
	options: UseExchangeCSignerActionOptions = {},
): UseExchangeCSignerActionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCSignerActionMutationOptions(exchange)));
}
