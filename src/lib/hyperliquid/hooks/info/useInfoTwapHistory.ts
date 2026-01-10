import type { TwapHistoryParameters, TwapHistoryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type TwapHistoryData = TwapHistoryResponse;
type TwapHistoryParams = TwapHistoryParameters;

export type UseInfoTwapHistoryParameters = TwapHistoryParams;
export type UseInfoTwapHistoryOptions<TData = TwapHistoryData> = QueryParameter<TwapHistoryData, TData>;
export type UseInfoTwapHistoryReturnType<TData = TwapHistoryData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoTwapHistory<TData = TwapHistoryData>(
	params: UseInfoTwapHistoryParameters,
	options: UseInfoTwapHistoryOptions<TData> = {},
): UseInfoTwapHistoryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("twapHistory", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.twapHistory(params, signal),
	});
}
