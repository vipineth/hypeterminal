import type { InfoClient, PerpsAtOpenInterestCapParameters, PerpsAtOpenInterestCapResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type PerpsAtOpenInterestCapData = PerpsAtOpenInterestCapResponse;
type PerpsAtOpenInterestCapParams = PerpsAtOpenInterestCapParameters;

export type UseInfoPerpsAtOpenInterestCapParameters = PerpsAtOpenInterestCapParams;
export type UseInfoPerpsAtOpenInterestCapOptions<TData = PerpsAtOpenInterestCapData> = QueryParameter<
	PerpsAtOpenInterestCapData,
	TData
>;
export type UseInfoPerpsAtOpenInterestCapReturnType<TData = PerpsAtOpenInterestCapData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getPerpsAtOpenInterestCapQueryOptions(
	info: InfoClient,
	params: PerpsAtOpenInterestCapParams,
): QueryOptions<PerpsAtOpenInterestCapData> {
	return {
		queryKey: infoKeys.method("perpsAtOpenInterestCap", params),
		queryFn: ({ signal }) => info.perpsAtOpenInterestCap(params, signal),
	};
}

export function useInfoPerpsAtOpenInterestCap<TData = PerpsAtOpenInterestCapData>(
	params: UseInfoPerpsAtOpenInterestCapParameters,
	options: UseInfoPerpsAtOpenInterestCapOptions<TData> = {},
): UseInfoPerpsAtOpenInterestCapReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPerpsAtOpenInterestCapQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
