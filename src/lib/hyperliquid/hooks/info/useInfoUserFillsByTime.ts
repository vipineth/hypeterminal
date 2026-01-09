import type { UserFillsByTimeParameters, UserFillsByTimeResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type UserFillsByTimeData = UserFillsByTimeResponse;
type UserFillsByTimeParams = UserFillsByTimeParameters;

export type UseInfoUserFillsByTimeParameters = UserFillsByTimeParams;
export type UseInfoUserFillsByTimeOptions<TData = UserFillsByTimeData> = QueryParameter<UserFillsByTimeData, TData>;
export type UseInfoUserFillsByTimeReturnType<TData = UserFillsByTimeData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoUserFillsByTime<TData = UserFillsByTimeData>(
	params: UseInfoUserFillsByTimeParameters,
	options: UseInfoUserFillsByTimeOptions<TData> = {},
): UseInfoUserFillsByTimeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userFillsByTime", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userFillsByTime(params, signal),
	});
}
