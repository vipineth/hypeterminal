import type { IsVipParameters, IsVipResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type IsVipData = IsVipResponse;
type IsVipParams = IsVipParameters;

export type UseInfoIsVipParameters = IsVipParams;
export type UseInfoIsVipOptions<TData = IsVipData> = QueryParameter<IsVipData, TData>;
export type UseInfoIsVipReturnType<TData = IsVipData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoIsVip<TData = IsVipData>(
	params: UseInfoIsVipParameters,
	options: UseInfoIsVipOptions<TData> = {},
): UseInfoIsVipReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("isVip", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.isVip(params, signal),
	});
}
