import type { UserTwapSliceFillsByTimeParameters, UserTwapSliceFillsByTimeResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserTwapSliceFillsByTimeData = UserTwapSliceFillsByTimeResponse;
type UserTwapSliceFillsByTimeParams = UserTwapSliceFillsByTimeParameters;

export type UseInfoUserTwapSliceFillsByTimeParameters = UserTwapSliceFillsByTimeParams;
export type UseInfoUserTwapSliceFillsByTimeOptions<TData = UserTwapSliceFillsByTimeData> = QueryParameter<
	UserTwapSliceFillsByTimeData,
	TData
>;
export type UseInfoUserTwapSliceFillsByTimeReturnType<TData = UserTwapSliceFillsByTimeData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoUserTwapSliceFillsByTime<TData = UserTwapSliceFillsByTimeData>(
	params: UseInfoUserTwapSliceFillsByTimeParameters,
	options: UseInfoUserTwapSliceFillsByTimeOptions<TData> = {},
): UseInfoUserTwapSliceFillsByTimeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userTwapSliceFillsByTime", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userTwapSliceFillsByTime(params, signal),
	});
}
