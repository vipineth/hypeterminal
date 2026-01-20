import type { InfoClient, MarginTableParameters, MarginTableResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type MarginTableData = MarginTableResponse;
type MarginTableParams = MarginTableParameters;

export type UseInfoMarginTableParameters = MarginTableParams;
export type UseInfoMarginTableOptions<TData = MarginTableData> = QueryParameter<MarginTableData, TData>;
export type UseInfoMarginTableReturnType<TData = MarginTableData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getMarginTableQueryOptions(info: InfoClient, params: MarginTableParams): QueryOptions<MarginTableData> {
	return {
		queryKey: infoKeys.method("marginTable", params),
		queryFn: ({ signal }) => info.marginTable(params, signal),
	};
}

export function useInfoMarginTable<TData = MarginTableData>(
	params: UseInfoMarginTableParameters,
	options: UseInfoMarginTableOptions<TData> = {},
): UseInfoMarginTableReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getMarginTableQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
