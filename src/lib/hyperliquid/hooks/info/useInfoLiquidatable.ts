import type { InfoClient, LiquidatableResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type LiquidatableData = LiquidatableResponse;

export type UseInfoLiquidatableOptions<TData = LiquidatableData> = QueryParameter<LiquidatableData, TData>;
export type UseInfoLiquidatableReturnType<TData = LiquidatableData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getLiquidatableQueryOptions(info: InfoClient): QueryOptions<LiquidatableData> {
	return {
		queryKey: infoKeys.method("liquidatable"),
		queryFn: ({ signal }) => info.liquidatable(signal),
	};
}

export function useInfoLiquidatable<TData = LiquidatableData>(
	options: UseInfoLiquidatableOptions<TData> = {},
): UseInfoLiquidatableReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getLiquidatableQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
