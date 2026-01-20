import type { InfoClient, TwapHistoryParameters, TwapHistoryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type TwapHistoryData = TwapHistoryResponse;
type TwapHistoryParams = TwapHistoryParameters;

export type UseInfoTwapHistoryParameters = TwapHistoryParams;
export type UseInfoTwapHistoryOptions<TData = TwapHistoryData> = QueryParameter<TwapHistoryData, TData>;
export type UseInfoTwapHistoryReturnType<TData = TwapHistoryData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
