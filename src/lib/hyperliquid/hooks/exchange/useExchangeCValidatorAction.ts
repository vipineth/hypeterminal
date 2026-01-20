import type { CValidatorActionParameters, CValidatorActionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CValidatorActionData = CValidatorActionSuccessResponse;
type CValidatorActionParams = CValidatorActionParameters;

export type UseExchangeCValidatorActionOptions = MutationParameter<CValidatorActionData, CValidatorActionParams>;
export type UseExchangeCValidatorActionReturnType = UseMutationResult<
	CValidatorActionData,
	HyperliquidQueryError,
	CValidatorActionParams
>;

export function getCValidatorActionMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CValidatorActionData, CValidatorActionParams> {
	return {
		mutationKey: createMutationKey("cValidatorAction"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.cValidatorAction(params)),
	};
}

export function useExchangeCValidatorAction(
	options: UseExchangeCValidatorActionOptions = {},
): UseExchangeCValidatorActionReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCValidatorActionMutationOptions(trading)));
}
