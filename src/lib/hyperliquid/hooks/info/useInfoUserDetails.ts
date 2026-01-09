import type { UserDetailsParameters, UserDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserDetailsData = UserDetailsResponse;
type UserDetailsParams = UserDetailsParameters;

export type UseInfoUserDetailsParameters = UserDetailsParams;
export type UseInfoUserDetailsOptions<TData = UserDetailsData> = QueryParameter<UserDetailsData, TData>;
export type UseInfoUserDetailsReturnType<TData = UserDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserDetails<TData = UserDetailsData>(
	params: UseInfoUserDetailsParameters,
	options: UseInfoUserDetailsOptions<TData> = {},
): UseInfoUserDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userDetails", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userDetails(params, signal),
	});
}
