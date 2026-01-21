import type { InfoClient, UserFillsByTimeParameters, UserFillsByTimeResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type UserFillsByTimeData = UserFillsByTimeResponse;
type UserFillsByTimeParams = UserFillsByTimeParameters;

export type UseInfoUserFillsByTimeParameters = UserFillsByTimeParams;
export type UseInfoUserFillsByTimeOptions<TData = UserFillsByTimeData> = QueryParameter<UserFillsByTimeData, TData>;
export type UseInfoUserFillsByTimeReturnType<TData = UserFillsByTimeData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getUserFillsByTimeQueryOptions(
	info: InfoClient,
	params: UserFillsByTimeParams,
): QueryOptions<UserFillsByTimeData> {
	return {
		queryKey: infoKeys.method("userFillsByTime", params),
		queryFn: ({ signal }) => info.userFillsByTime(params, signal),
	};
}

export function useInfoUserFillsByTime<TData = UserFillsByTimeData>(
	params: UseInfoUserFillsByTimeParameters,
	options: UseInfoUserFillsByTimeOptions<TData> = {},
): UseInfoUserFillsByTimeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserFillsByTimeQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
