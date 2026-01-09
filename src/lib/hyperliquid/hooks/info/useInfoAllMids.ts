import type { AllMidsParameters, AllMidsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type AllMidsData = AllMidsResponse;
type AllMidsParams = AllMidsParameters;

export type UseInfoAllMidsParameters = AllMidsParams;
export type UseInfoAllMidsOptions<TData = AllMidsData> = QueryParameter<AllMidsData, TData>;
export type UseInfoAllMidsReturnType<TData = AllMidsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoAllMids<TData = AllMidsData>(
	params: UseInfoAllMidsParameters,
	options: UseInfoAllMidsOptions<TData> = {},
): UseInfoAllMidsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("allMids", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.allMids(params, signal),
	});
}
