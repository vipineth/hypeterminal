import type { MarginTableParameters, MarginTableResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type MarginTableData = MarginTableResponse;
type MarginTableParams = MarginTableParameters;

export type UseInfoMarginTableParameters = MarginTableParams;
export type UseInfoMarginTableOptions<TData = MarginTableData> = QueryParameter<MarginTableData, TData>;
export type UseInfoMarginTableReturnType<TData = MarginTableData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoMarginTable<TData = MarginTableData>(
	params: UseInfoMarginTableParameters,
	options: UseInfoMarginTableOptions<TData> = {},
): UseInfoMarginTableReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("marginTable", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.marginTable(params, signal),
	});
}
