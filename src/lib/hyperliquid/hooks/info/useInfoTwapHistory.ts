import type { InfoClient, TwapHistoryParameters, TwapHistoryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type TwapHistoryData = TwapHistoryResponse;
type TwapHistoryParams = TwapHistoryParameters;

export type UseInfoTwapHistoryParameters = TwapHistoryParams;
export type UseInfoTwapHistoryOptions<TData = TwapHistoryData> = QueryParameter<TwapHistoryData, TData>;
export type UseInfoTwapHistoryReturnType<TData = TwapHistoryData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getTwapHistoryQueryOptions(info: InfoClient, params: TwapHistoryParams): QueryOptions<TwapHistoryData> {
	return {
		queryKey: infoKeys.method("twapHistory", params),
		queryFn: ({ signal }) => info.twapHistory(params, signal),
	};
}

export function useInfoTwapHistory<TData = TwapHistoryData>(
	params: UseInfoTwapHistoryParameters,
	options: UseInfoTwapHistoryOptions<TData> = {},
): UseInfoTwapHistoryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getTwapHistoryQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
