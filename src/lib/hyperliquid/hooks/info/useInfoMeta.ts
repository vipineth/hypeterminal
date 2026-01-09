import type { MetaParameters, MetaResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type MetaData = MetaResponse;
type MetaParams = MetaParameters;

export type UseInfoMetaParameters = MetaParams;
export type UseInfoMetaOptions<TData = MetaData> = QueryParameter<MetaData, TData>;
export type UseInfoMetaReturnType<TData = MetaData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoMeta<TData = MetaData>(
	params: UseInfoMetaParameters,
	options: UseInfoMetaOptions<TData> = {},
): UseInfoMetaReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("meta", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.meta(params, signal),
	});
}
