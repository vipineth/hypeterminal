import type { InfoClient, UserRoleParameters, UserRoleResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type UserRoleData = UserRoleResponse;
type UserRoleParams = UserRoleParameters;

export type UseInfoUserRoleParameters = UserRoleParams;
export type UseInfoUserRoleOptions<TData = UserRoleData> = QueryParameter<UserRoleData, TData>;
export type UseInfoUserRoleReturnType<TData = UserRoleData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getUserRoleQueryOptions(info: InfoClient, params: UserRoleParams): QueryOptions<UserRoleData> {
	return {
		queryKey: infoKeys.method("userRole", params),
		queryFn: ({ signal }) => info.userRole(params, signal),
	};
}

export function useInfoUserRole<TData = UserRoleData>(
	params: UseInfoUserRoleParameters,
	options: UseInfoUserRoleOptions<TData> = {},
): UseInfoUserRoleReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserRoleQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
