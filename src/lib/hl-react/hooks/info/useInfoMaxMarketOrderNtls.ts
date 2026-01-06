import type { MaxMarketOrderNtlsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type MaxMarketOrderNtlsData = MaxMarketOrderNtlsResponse;

export type UseInfoMaxMarketOrderNtlsOptions<TData = MaxMarketOrderNtlsData> = QueryParameter<
	MaxMarketOrderNtlsData,
	TData
>;
export type UseInfoMaxMarketOrderNtlsReturnType<TData = MaxMarketOrderNtlsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoMaxMarketOrderNtls<TData = MaxMarketOrderNtlsData>(
	options: UseInfoMaxMarketOrderNtlsOptions<TData> = {},
): UseInfoMaxMarketOrderNtlsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("maxMarketOrderNtls");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.maxMarketOrderNtls(signal),
	});
}
