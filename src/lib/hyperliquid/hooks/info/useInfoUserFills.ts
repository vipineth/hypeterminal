import type { UserFillsParameters, UserFillsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserFillsData = UserFillsResponse;
type UserFillsParams = UserFillsParameters;

export type UseInfoUserFillsParameters = UserFillsParams;
export type UseInfoUserFillsOptions<TData = UserFillsData> = QueryParameter<UserFillsData, TData>;
export type UseInfoUserFillsReturnType<TData = UserFillsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserFills<TData = UserFillsData>(
	params: UseInfoUserFillsParameters,
	options: UseInfoUserFillsOptions<TData> = {},
): UseInfoUserFillsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userFills", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userFills(params, signal),
	});
}
