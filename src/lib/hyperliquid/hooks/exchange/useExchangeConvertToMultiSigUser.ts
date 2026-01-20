import type {
	ConvertToMultiSigUserParameters,
	ConvertToMultiSigUserSuccessResponse,
	ExchangeClient,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.convertToMultiSigUser(params);
		},
	};
}

export function useExchangeConvertToMultiSigUser(
	options: UseExchangeConvertToMultiSigUserOptions = {},
): UseExchangeConvertToMultiSigUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getConvertToMultiSigUserMutationOptions(exchange)));
}
