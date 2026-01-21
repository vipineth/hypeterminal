import type {
	ConvertToMultiSigUserParameters,
	ConvertToMultiSigUserSuccessResponse,
	ExchangeClient,
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

type ConvertToMultiSigUserData = ConvertToMultiSigUserSuccessResponse;
type ConvertToMultiSigUserParams = ConvertToMultiSigUserParameters;

export type UseExchangeConvertToMultiSigUserOptions = MutationParameter<
	ConvertToMultiSigUserData,
	ConvertToMultiSigUserParams
>;
export type UseExchangeConvertToMultiSigUserReturnType = UseMutationResult<
	ConvertToMultiSigUserData,
	HyperliquidQueryError,
	ConvertToMultiSigUserParams
>;

export function getConvertToMultiSigUserMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ConvertToMultiSigUserData, ConvertToMultiSigUserParams> {
	return {
		mutationKey: createMutationKey("convertToMultiSigUser"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.convertToMultiSigUser(params)),
	};
}

export function useExchangeConvertToMultiSigUser(
	options: UseExchangeConvertToMultiSigUserOptions = {},
): UseExchangeConvertToMultiSigUserReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getConvertToMultiSigUserMutationOptions(trading)));
}
