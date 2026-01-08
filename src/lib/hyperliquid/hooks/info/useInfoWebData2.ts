import type { WebData2Parameters, WebData2Response } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type WebData2Data = WebData2Response;
type WebData2Params = WebData2Parameters;

export type UseInfoWebData2Parameters = WebData2Params;
export type UseInfoWebData2Options<TData = WebData2Data> = QueryParameter<WebData2Data, TData>;
export type UseInfoWebData2ReturnType<TData = WebData2Data> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoWebData2<TData = WebData2Data>(
	params: UseInfoWebData2Parameters,
	options: UseInfoWebData2Options<TData> = {},
): UseInfoWebData2ReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("webData2", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.webData2(params, signal),
	});
}
