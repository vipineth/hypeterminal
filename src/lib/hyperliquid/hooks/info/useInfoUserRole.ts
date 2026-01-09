import type { UserRoleParameters, UserRoleResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserRoleData = UserRoleResponse;
type UserRoleParams = UserRoleParameters;

export type UseInfoUserRoleParameters = UserRoleParams;
export type UseInfoUserRoleOptions<TData = UserRoleData> = QueryParameter<UserRoleData, TData>;
export type UseInfoUserRoleReturnType<TData = UserRoleData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserRole<TData = UserRoleData>(
	params: UseInfoUserRoleParameters,
	options: UseInfoUserRoleOptions<TData> = {},
): UseInfoUserRoleReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userRole", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userRole(params, signal),
	});
}
