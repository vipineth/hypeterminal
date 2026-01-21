import type { InfoClient, MaxBuilderFeeParameters, MaxBuilderFeeResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type MaxBuilderFeeData = MaxBuilderFeeResponse;
type MaxBuilderFeeParams = MaxBuilderFeeParameters;

export type UseInfoMaxBuilderFeeParameters = MaxBuilderFeeParams;
export type UseInfoMaxBuilderFeeOptions<TData = MaxBuilderFeeData> = QueryParameter<MaxBuilderFeeData, TData>;
export type UseInfoMaxBuilderFeeReturnType<TData = MaxBuilderFeeData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getMaxBuilderFeeQueryOptions(
	info: InfoClient,
	params: MaxBuilderFeeParams,
): QueryOptions<MaxBuilderFeeData> {
	return {
		queryKey: infoKeys.method("maxBuilderFee", params),
		queryFn: ({ signal }) => info.maxBuilderFee(params, signal),
	};
}

export function useInfoMaxBuilderFee<TData = MaxBuilderFeeData>(
	params: UseInfoMaxBuilderFeeParameters,
	options: UseInfoMaxBuilderFeeOptions<TData> = {},
): UseInfoMaxBuilderFeeReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getMaxBuilderFeeQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
