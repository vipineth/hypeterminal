import type { InfoClient, UserDetailsParameters, UserDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserDetailsData = UserDetailsResponse;
type UserDetailsParams = UserDetailsParameters;

export type UseInfoUserDetailsParameters = UserDetailsParams;
export type UseInfoUserDetailsOptions<TData = UserDetailsData> = QueryParameter<UserDetailsData, TData>;
export type UseInfoUserDetailsReturnType<TData = UserDetailsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getUserDetailsQueryOptions(info: InfoClient, params: UserDetailsParams): QueryOptions<UserDetailsData> {
	return {
		queryKey: infoKeys.method("userDetails", params),
		queryFn: ({ signal }) => info.userDetails(params, signal),
	};
}

export function useInfoUserDetails<TData = UserDetailsData>(
	params: UseInfoUserDetailsParameters,
	options: UseInfoUserDetailsOptions<TData> = {},
): UseInfoUserDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserDetailsQueryOptions(info, params);
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
