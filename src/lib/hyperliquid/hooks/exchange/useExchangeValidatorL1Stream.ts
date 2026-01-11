import type { ValidatorL1StreamParameters, ValidatorL1StreamSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ValidatorL1StreamData = ValidatorL1StreamSuccessResponse;
type ValidatorL1StreamParams = ValidatorL1StreamParameters;

export type UseExchangeValidatorL1StreamOptions = MutationParameter<ValidatorL1StreamData, ValidatorL1StreamParams>;
export type UseExchangeValidatorL1StreamReturnType = UseMutationResult<
	ValidatorL1StreamData,
	HyperliquidQueryError,
	ValidatorL1StreamParams
>;

export function useExchangeValidatorL1Stream(
	options: UseExchangeValidatorL1StreamOptions = {},
): UseExchangeValidatorL1StreamReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("validatorL1Stream"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.validatorL1Stream(params);
		},
	});
}
