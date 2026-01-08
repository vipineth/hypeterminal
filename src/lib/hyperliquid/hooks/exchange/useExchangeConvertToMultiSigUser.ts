import type { ConvertToMultiSigUserParameters, ConvertToMultiSigUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeConvertToMultiSigUser(
	options: UseExchangeConvertToMultiSigUserOptions = {},
): UseExchangeConvertToMultiSigUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("convertToMultiSigUser"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.convertToMultiSigUser(params);
		},
	});
}
