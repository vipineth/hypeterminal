import type { InfoClient, MetaParameters, MetaResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type MetaData = MetaResponse;
type MetaParams = MetaParameters;

export type UseInfoMetaParameters = MetaParams;
export type UseInfoMetaOptions<TData = MetaData> = QueryParameter<MetaData, TData>;
export type UseInfoMetaReturnType<TData = MetaData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getMetaQueryOptions(info: InfoClient, params: MetaParams): QueryOptions<MetaData> {
	return {
		queryKey: infoKeys.method("meta", params),
		queryFn: ({ signal }) => info.meta(params, signal),
	};
}

export function useInfoMeta<TData = MetaData>(
	params: UseInfoMetaParameters,
	options: UseInfoMetaOptions<TData> = {},
): UseInfoMetaReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getMetaQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
