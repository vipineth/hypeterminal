import type { CValidatorActionParameters, CValidatorActionSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeCValidatorAction(
	options: UseExchangeCValidatorActionOptions = {},
): UseExchangeCValidatorActionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cValidatorAction"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cValidatorAction(params);
		},
	});
}
