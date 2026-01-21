import type { InfoClient, PredictedFundingsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type PredictedFundingsData = PredictedFundingsResponse;

export type UseInfoPredictedFundingsOptions<TData = PredictedFundingsData> = QueryParameter<
	PredictedFundingsData,
	TData
>;
export type UseInfoPredictedFundingsReturnType<TData = PredictedFundingsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getPredictedFundingsQueryOptions(info: InfoClient): QueryOptions<PredictedFundingsData> {
	return {
		queryKey: infoKeys.method("predictedFundings"),
		queryFn: ({ signal }) => info.predictedFundings(signal),
	};
}

export function useInfoPredictedFundings<TData = PredictedFundingsData>(
	options: UseInfoPredictedFundingsOptions<TData> = {},
): UseInfoPredictedFundingsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPredictedFundingsQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
