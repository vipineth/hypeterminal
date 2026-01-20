import type { InfoClient, IsVipParameters, IsVipResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type IsVipData = IsVipResponse;
type IsVipParams = IsVipParameters;

export type UseInfoIsVipParameters = IsVipParams;
export type UseInfoIsVipOptions<TData = IsVipData> = QueryParameter<IsVipData, TData>;
export type UseInfoIsVipReturnType<TData = IsVipData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getIsVipQueryOptions(info: InfoClient, params: IsVipParams): QueryOptions<IsVipData> {
	return {
		queryKey: infoKeys.method("isVip", params),
		queryFn: ({ signal }) => info.isVip(params, signal),
	};
}

export function useInfoIsVip<TData = IsVipData>(
	params: UseInfoIsVipParameters,
	options: UseInfoIsVipOptions<TData> = {},
): UseInfoIsVipReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getIsVipQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
