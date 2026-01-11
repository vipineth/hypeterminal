import type { UserTwapSliceFillsParameters, UserTwapSliceFillsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
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

export function useInfoUserTwapSliceFills<TData = UserTwapSliceFillsData>(
	params: UseInfoUserTwapSliceFillsParameters,
	options: UseInfoUserTwapSliceFillsOptions<TData> = {},
): UseInfoUserTwapSliceFillsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userTwapSliceFills", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userTwapSliceFills(params, signal),
	});
}
