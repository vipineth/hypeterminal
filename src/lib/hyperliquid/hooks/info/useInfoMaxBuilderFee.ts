import type { MaxBuilderFeeParameters, MaxBuilderFeeResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type MaxBuilderFeeData = MaxBuilderFeeResponse;
type MaxBuilderFeeParams = MaxBuilderFeeParameters;

export type UseInfoMaxBuilderFeeParameters = MaxBuilderFeeParams;
export type UseInfoMaxBuilderFeeOptions<TData = MaxBuilderFeeData> = QueryParameter<MaxBuilderFeeData, TData>;
export type UseInfoMaxBuilderFeeReturnType<TData = MaxBuilderFeeData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoMaxBuilderFee<TData = MaxBuilderFeeData>(
	params: UseInfoMaxBuilderFeeParameters,
	options: UseInfoMaxBuilderFeeOptions<TData> = {},
): UseInfoMaxBuilderFeeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("maxBuilderFee", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.maxBuilderFee(params, signal),
	});
}
