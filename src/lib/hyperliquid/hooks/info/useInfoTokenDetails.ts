import type { TokenDetailsParameters, TokenDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TokenDetailsData = TokenDetailsResponse;
type TokenDetailsParams = TokenDetailsParameters;

export type UseInfoTokenDetailsParameters = TokenDetailsParams;
export type UseInfoTokenDetailsOptions<TData = TokenDetailsData> = QueryParameter<TokenDetailsData, TData>;
export type UseInfoTokenDetailsReturnType<TData = TokenDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoTokenDetails<TData = TokenDetailsData>(
	params: UseInfoTokenDetailsParameters,
	options: UseInfoTokenDetailsOptions<TData> = {},
): UseInfoTokenDetailsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("tokenDetails", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.tokenDetails(params, signal),
	});
}
