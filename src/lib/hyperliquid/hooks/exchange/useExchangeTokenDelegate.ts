import type { ExchangeClient, TokenDelegateParameters, TokenDelegateSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TokenDelegateData = TokenDelegateSuccessResponse;
type TokenDelegateParams = TokenDelegateParameters;

export type UseExchangeTokenDelegateOptions = MutationParameter<TokenDelegateData, TokenDelegateParams>;
export type UseExchangeTokenDelegateReturnType = UseMutationResult<
	TokenDelegateData,
	HyperliquidQueryError,
	TokenDelegateParams
>;

export function getTokenDelegateMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<TokenDelegateData, TokenDelegateParams> {
	return {
		mutationKey: createMutationKey("tokenDelegate"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.tokenDelegate(params)),
	};
}

export function useExchangeTokenDelegate(
	options: UseExchangeTokenDelegateOptions = {},
): UseExchangeTokenDelegateReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTokenDelegateMutationOptions(exchange)));
}
