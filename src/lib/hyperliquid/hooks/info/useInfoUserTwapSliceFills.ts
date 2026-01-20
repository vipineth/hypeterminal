import type { InfoClient, UserTwapSliceFillsParameters, UserTwapSliceFillsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserTwapSliceFillsData = UserTwapSliceFillsResponse;
type UserTwapSliceFillsParams = UserTwapSliceFillsParameters;

export type UseInfoUserTwapSliceFillsParameters = UserTwapSliceFillsParams;
export type UseInfoUserTwapSliceFillsOptions<TData = UserTwapSliceFillsData> = QueryParameter<
	UserTwapSliceFillsData,
	TData
>;
export type UseInfoUserTwapSliceFillsReturnType<TData = UserTwapSliceFillsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getUserTwapSliceFillsQueryOptions(
	info: InfoClient,
	params: UserTwapSliceFillsParams,
): QueryOptions<UserTwapSliceFillsData> {
	return {
		queryKey: infoKeys.method("userTwapSliceFills", params),
		queryFn: ({ signal }) => info.userTwapSliceFills(params, signal),
	};
}

export function useInfoUserTwapSliceFills<TData = UserTwapSliceFillsData>(
	params: UseInfoUserTwapSliceFillsParameters,
	options: UseInfoUserTwapSliceFillsOptions<TData> = {},
): UseInfoUserTwapSliceFillsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserTwapSliceFillsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
