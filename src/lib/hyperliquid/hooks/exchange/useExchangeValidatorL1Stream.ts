import type {
	ExchangeClient,
	ValidatorL1StreamParameters,
	ValidatorL1StreamSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface ValidatorL1StreamMutationContext {
	exchange: ExchangeClient | null;
}

export function getValidatorL1StreamMutationOptions(
	context: ValidatorL1StreamMutationContext,
): MutationOptions<ValidatorL1StreamData, ValidatorL1StreamParams> {
	return {
		mutationKey: createMutationKey("validatorL1Stream"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.validatorL1Stream(params);
		},
	};
}

export function useExchangeValidatorL1Stream(
	options: UseExchangeValidatorL1StreamOptions = {},
): UseExchangeValidatorL1StreamReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getValidatorL1StreamMutationOptions({ exchange })));
}
