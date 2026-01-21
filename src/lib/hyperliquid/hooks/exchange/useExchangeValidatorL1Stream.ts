import type {
	ExchangeClient,
	ValidatorL1StreamParameters,
	ValidatorL1StreamSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type ValidatorL1StreamData = ValidatorL1StreamSuccessResponse;
type ValidatorL1StreamParams = ValidatorL1StreamParameters;

export type UseExchangeValidatorL1StreamOptions = MutationParameter<ValidatorL1StreamData, ValidatorL1StreamParams>;
export type UseExchangeValidatorL1StreamReturnType = UseMutationResult<
	ValidatorL1StreamData,
	HyperliquidQueryError,
	ValidatorL1StreamParams
>;

export function getValidatorL1StreamMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ValidatorL1StreamData, ValidatorL1StreamParams> {
	return {
		mutationKey: createMutationKey("validatorL1Stream"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.validatorL1Stream(params)),
	};
}

export function useExchangeValidatorL1Stream(
	options: UseExchangeValidatorL1StreamOptions = {},
): UseExchangeValidatorL1StreamReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getValidatorL1StreamMutationOptions(trading)));
}
