import type { TokenDelegateParameters, TokenDelegateSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeTokenDelegate(
	options: UseExchangeTokenDelegateOptions = {},
): UseExchangeTokenDelegateReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("tokenDelegate"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.tokenDelegate(params);
		},
	});
}
