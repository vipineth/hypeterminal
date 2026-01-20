import type {
	ConvertToMultiSigUserParameters,
	ConvertToMultiSigUserSuccessResponse,
	ExchangeClient,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
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

interface ConvertToMultiSigUserMutationContext {
	exchange: ExchangeClient | null;
}

export function getConvertToMultiSigUserMutationOptions(
	context: ConvertToMultiSigUserMutationContext,
): MutationOptions<ConvertToMultiSigUserData, ConvertToMultiSigUserParams> {
	return {
		mutationKey: createMutationKey("convertToMultiSigUser"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.convertToMultiSigUser(params);
		},
	};
}

export function useExchangeConvertToMultiSigUser(
	options: UseExchangeConvertToMultiSigUserOptions = {},
): UseExchangeConvertToMultiSigUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getConvertToMultiSigUserMutationOptions({ exchange })));
}
