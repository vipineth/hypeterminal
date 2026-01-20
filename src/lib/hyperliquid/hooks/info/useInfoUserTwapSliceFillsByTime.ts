import type {
	InfoClient,
	UserTwapSliceFillsByTimeParameters,
	UserTwapSliceFillsByTimeResponse,
} from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

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

export function getUserTwapSliceFillsByTimeQueryOptions(
	info: InfoClient,
	params: UserTwapSliceFillsByTimeParams,
): QueryOptions<UserTwapSliceFillsByTimeData> {
	return {
		queryKey: infoKeys.method("userTwapSliceFillsByTime", params),
		queryFn: ({ signal }) => info.userTwapSliceFillsByTime(params, signal),
	};
}

export function useInfoUserTwapSliceFillsByTime<TData = UserTwapSliceFillsByTimeData>(
	params: UseInfoUserTwapSliceFillsByTimeParameters,
	options: UseInfoUserTwapSliceFillsByTimeOptions<TData> = {},
): UseInfoUserTwapSliceFillsByTimeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserTwapSliceFillsByTimeQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
