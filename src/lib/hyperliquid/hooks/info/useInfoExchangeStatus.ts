import type { ExchangeStatusResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ExchangeStatusData = ExchangeStatusResponse;

export type UseInfoExchangeStatusOptions<TData = ExchangeStatusData> = QueryParameter<ExchangeStatusData, TData>;
export type UseInfoExchangeStatusReturnType<TData = ExchangeStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getExchangeStatusQueryOptions(info: InfoClient): QueryOptions<ExchangeStatusData> {
	return {
		queryKey: infoKeys.method("exchangeStatus"),
		queryFn: ({ signal }) => info.exchangeStatus(signal),
	};
}

export function useInfoExchangeStatus<TData = ExchangeStatusData>(
	options: UseInfoExchangeStatusOptions<TData> = {},
): UseInfoExchangeStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getExchangeStatusQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
