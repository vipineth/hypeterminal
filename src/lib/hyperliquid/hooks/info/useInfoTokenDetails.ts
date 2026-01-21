import type { InfoClient, TokenDetailsParameters, TokenDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type TokenDetailsData = TokenDetailsResponse;
type TokenDetailsParams = TokenDetailsParameters;

export type UseInfoTokenDetailsParameters = TokenDetailsParams;
export type UseInfoTokenDetailsOptions<TData = TokenDetailsData> = QueryParameter<TokenDetailsData, TData>;
export type UseInfoTokenDetailsReturnType<TData = TokenDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getTokenDetailsQueryOptions(
	info: InfoClient,
	params: TokenDetailsParams,
): QueryOptions<TokenDetailsData> {
	return {
		queryKey: infoKeys.method("tokenDetails", params),
		queryFn: ({ signal }) => info.tokenDetails(params, signal),
	};
}

export function useInfoTokenDetails<TData = TokenDetailsData>(
	params: UseInfoTokenDetailsParameters,
	options: UseInfoTokenDetailsOptions<TData> = {},
): UseInfoTokenDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getTokenDetailsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
