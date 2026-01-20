import type { ExchangeClient, TokenDelegateParameters, TokenDelegateSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface TokenDelegateMutationContext {
	exchange: ExchangeClient | null;
}

export function getTokenDelegateMutationOptions(
	context: TokenDelegateMutationContext,
): MutationOptions<TokenDelegateData, TokenDelegateParams> {
	return {
		mutationKey: createMutationKey("tokenDelegate"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.tokenDelegate(params);
		},
	};
}

export function useExchangeTokenDelegate(
	options: UseExchangeTokenDelegateOptions = {},
): UseExchangeTokenDelegateReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTokenDelegateMutationOptions({ exchange })));
}
