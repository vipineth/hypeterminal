import type { UserRateLimitParameters, UserRateLimitResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserRateLimitData = UserRateLimitResponse;
type UserRateLimitParams = UserRateLimitParameters;

export type UseInfoUserRateLimitParameters = UserRateLimitParams;
export type UseInfoUserRateLimitOptions<TData = UserRateLimitData> = QueryParameter<UserRateLimitData, TData>;
export type UseInfoUserRateLimitReturnType<TData = UserRateLimitData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserRateLimit<TData = UserRateLimitData>(
	params: UseInfoUserRateLimitParameters,
	options: UseInfoUserRateLimitOptions<TData> = {},
): UseInfoUserRateLimitReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userRateLimit", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userRateLimit(params, signal),
	});
}
