import type { InfoClient, MaxMarketOrderNtlsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type MaxMarketOrderNtlsData = MaxMarketOrderNtlsResponse;

export type UseInfoMaxMarketOrderNtlsOptions<TData = MaxMarketOrderNtlsData> = QueryParameter<
	MaxMarketOrderNtlsData,
	TData
>;
export type UseInfoMaxMarketOrderNtlsReturnType<TData = MaxMarketOrderNtlsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getMaxMarketOrderNtlsQueryOptions(info: InfoClient): QueryOptions<MaxMarketOrderNtlsData> {
	return {
		queryKey: infoKeys.method("maxMarketOrderNtls"),
		queryFn: ({ signal }) => info.maxMarketOrderNtls(signal),
	};
}

export function useInfoMaxMarketOrderNtls<TData = MaxMarketOrderNtlsData>(
	options: UseInfoMaxMarketOrderNtlsOptions<TData> = {},
): UseInfoMaxMarketOrderNtlsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getMaxMarketOrderNtlsQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
