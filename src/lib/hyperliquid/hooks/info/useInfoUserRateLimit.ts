import type { InfoClient, UserRateLimitParameters, UserRateLimitResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserRateLimitData = UserRateLimitResponse;
type UserRateLimitParams = UserRateLimitParameters;

export type UseInfoUserRateLimitParameters = UserRateLimitParams;
export type UseInfoUserRateLimitOptions<TData = UserRateLimitData> = QueryParameter<UserRateLimitData, TData>;
export type UseInfoUserRateLimitReturnType<TData = UserRateLimitData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getUserRateLimitQueryOptions(
	info: InfoClient,
	params: UserRateLimitParams,
): QueryOptions<UserRateLimitData> {
	return {
		queryKey: infoKeys.method("userRateLimit", params),
		queryFn: ({ signal }) => info.userRateLimit(params, signal),
	};
}

export function useInfoUserRateLimit<TData = UserRateLimitData>(
	params: UseInfoUserRateLimitParameters,
	options: UseInfoUserRateLimitOptions<TData> = {},
): UseInfoUserRateLimitReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserRateLimitQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
