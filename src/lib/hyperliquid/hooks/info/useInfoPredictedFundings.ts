import type { PredictedFundingsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PredictedFundingsData = PredictedFundingsResponse;

export type UseInfoPredictedFundingsOptions<TData = PredictedFundingsData> = QueryParameter<
	PredictedFundingsData,
	TData
>;
export type UseInfoPredictedFundingsReturnType<TData = PredictedFundingsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoPredictedFundings<TData = PredictedFundingsData>(
	options: UseInfoPredictedFundingsOptions<TData> = {},
): UseInfoPredictedFundingsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("predictedFundings");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.predictedFundings(signal),
	});
}
