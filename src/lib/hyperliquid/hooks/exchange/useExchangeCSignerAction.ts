import type { CSignerActionParameters, CSignerActionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
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

interface CSignerActionMutationContext {
	exchange: ExchangeClient | null;
}

export function getCSignerActionMutationOptions(
	context: CSignerActionMutationContext,
): MutationOptions<CSignerActionData, CSignerActionParams> {
	return {
		mutationKey: createMutationKey("cSignerAction"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.cSignerAction(params);
		},
	};
}

export function useExchangeCSignerAction(
	options: UseExchangeCSignerActionOptions = {},
): UseExchangeCSignerActionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCSignerActionMutationOptions({ exchange })));
}
