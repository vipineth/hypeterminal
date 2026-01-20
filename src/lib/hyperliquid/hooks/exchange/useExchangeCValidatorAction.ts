import type { CValidatorActionParameters, CValidatorActionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface CValidatorActionMutationContext {
	exchange: ExchangeClient | null;
}

export function getCValidatorActionMutationOptions(
	context: CValidatorActionMutationContext,
): MutationOptions<CValidatorActionData, CValidatorActionParams> {
	return {
		mutationKey: createMutationKey("cValidatorAction"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.cValidatorAction(params);
		},
	};
}

export function useExchangeCValidatorAction(
	options: UseExchangeCValidatorActionOptions = {},
): UseExchangeCValidatorActionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCValidatorActionMutationOptions({ exchange })));
}
