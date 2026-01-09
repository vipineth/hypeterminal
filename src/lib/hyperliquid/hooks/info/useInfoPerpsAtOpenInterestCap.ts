import type { PerpsAtOpenInterestCapParameters, PerpsAtOpenInterestCapResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

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

export function useInfoPerpsAtOpenInterestCap<TData = PerpsAtOpenInterestCapData>(
	params: UseInfoPerpsAtOpenInterestCapParameters,
	options: UseInfoPerpsAtOpenInterestCapOptions<TData> = {},
): UseInfoPerpsAtOpenInterestCapReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("perpsAtOpenInterestCap", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.perpsAtOpenInterestCap(params, signal),
	});
}
