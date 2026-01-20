import type { InfoClient, TokenDetailsParameters, TokenDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type TokenDetailsData = TokenDetailsResponse;
type TokenDetailsParams = TokenDetailsParameters;

export type UseInfoTokenDetailsParameters = TokenDetailsParams;
export type UseInfoTokenDetailsOptions<TData = TokenDetailsData> = QueryParameter<TokenDetailsData, TData>;
export type UseInfoTokenDetailsReturnType<TData = TokenDetailsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
