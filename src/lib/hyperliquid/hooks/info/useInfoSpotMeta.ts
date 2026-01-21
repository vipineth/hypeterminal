import type { InfoClient, SpotMetaResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type SpotMetaData = SpotMetaResponse;

export type UseInfoSpotMetaOptions<TData = SpotMetaData> = QueryParameter<SpotMetaData, TData>;
export type UseInfoSpotMetaReturnType<TData = SpotMetaData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getSpotMetaQueryOptions(info: InfoClient): QueryOptions<SpotMetaData> {
	return {
		queryKey: infoKeys.method("spotMeta"),
		queryFn: ({ signal }) => info.spotMeta(signal),
	};
}

export function useInfoSpotMeta<TData = SpotMetaData>(
	options: UseInfoSpotMetaOptions<TData> = {},
): UseInfoSpotMetaReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSpotMetaQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
