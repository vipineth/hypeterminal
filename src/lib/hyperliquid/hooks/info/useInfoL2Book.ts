import type { InfoClient, L2BookParameters, L2BookResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type L2BookData = L2BookResponse;
type L2BookParams = L2BookParameters;

export type UseInfoL2BookParameters = L2BookParams;
export type UseInfoL2BookOptions<TData = L2BookData> = QueryParameter<L2BookData, TData>;
export type UseInfoL2BookReturnType<TData = L2BookData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getL2BookQueryOptions(info: InfoClient, params: L2BookParams): QueryOptions<L2BookData> {
	return {
		queryKey: infoKeys.method("l2Book", params),
		queryFn: ({ signal }) => info.l2Book(params, signal),
	};
}

export function useInfoL2Book<TData = L2BookData>(
	params: UseInfoL2BookParameters,
	options: UseInfoL2BookOptions<TData> = {},
): UseInfoL2BookReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getL2BookQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
