import type { ExchangeClient, TokenDelegateParameters, TokenDelegateSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
	const { user } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTokenDelegateMutationOptions(user)));
}
