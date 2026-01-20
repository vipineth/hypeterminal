import type { InfoClient, WebData2Parameters, WebData2Response } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type WebData2Data = WebData2Response;
type WebData2Params = WebData2Parameters;

export type UseInfoWebData2Parameters = WebData2Params;
export type UseInfoWebData2Options<TData = WebData2Data> = QueryParameter<WebData2Data, TData>;
export type UseInfoWebData2ReturnType<TData = WebData2Data> = UseQueryResult<TData, HyperliquidQueryError>;

export function getWebData2QueryOptions(info: InfoClient, params: WebData2Params): QueryOptions<WebData2Data> {
	return {
		queryKey: infoKeys.method("webData2", params),
		queryFn: ({ signal }) => info.webData2(params, signal),
	};
}

export function useInfoWebData2<TData = WebData2Data>(
	params: UseInfoWebData2Parameters,
	options: UseInfoWebData2Options<TData> = {},
): UseInfoWebData2ReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getWebData2QueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
