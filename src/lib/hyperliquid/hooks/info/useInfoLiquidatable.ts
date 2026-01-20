import type { InfoClient, LiquidatableResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type LiquidatableData = LiquidatableResponse;

export type UseInfoLiquidatableOptions<TData = LiquidatableData> = QueryParameter<LiquidatableData, TData>;
export type UseInfoLiquidatableReturnType<TData = LiquidatableData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
