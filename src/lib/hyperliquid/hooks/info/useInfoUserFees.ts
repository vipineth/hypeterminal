import type { UserFeesParameters, UserFeesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserFeesData = UserFeesResponse;
type UserFeesParams = UserFeesParameters;

export type UseInfoUserFeesParameters = UserFeesParams;
export type UseInfoUserFeesOptions<TData = UserFeesData> = QueryParameter<UserFeesData, TData>;
export type UseInfoUserFeesReturnType<TData = UserFeesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserFees<TData = UserFeesData>(
	params: UseInfoUserFeesParameters,
	options: UseInfoUserFeesOptions<TData> = {},
): UseInfoUserFeesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userFees", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userFees(params, signal),
	});
}
