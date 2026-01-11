import type { LiquidatableResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type LiquidatableData = LiquidatableResponse;

export type UseInfoLiquidatableOptions<TData = LiquidatableData> = QueryParameter<LiquidatableData, TData>;
export type UseInfoLiquidatableReturnType<TData = LiquidatableData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoLiquidatable<TData = LiquidatableData>(
	options: UseInfoLiquidatableOptions<TData> = {},
): UseInfoLiquidatableReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("liquidatable");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.liquidatable(signal),
	});
}
