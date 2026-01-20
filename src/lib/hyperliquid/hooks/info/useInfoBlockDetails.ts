import type { BlockDetailsParameters, BlockDetailsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type BlockDetailsData = BlockDetailsResponse;
type BlockDetailsParams = BlockDetailsParameters;

export type UseInfoBlockDetailsParameters = BlockDetailsParams;
export type UseInfoBlockDetailsOptions<TData = BlockDetailsData> = QueryParameter<BlockDetailsData, TData>;
export type UseInfoBlockDetailsReturnType<TData = BlockDetailsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getBlockDetailsQueryOptions(
	info: InfoClient,
	params: BlockDetailsParams,
): QueryOptions<BlockDetailsData> {
	return {
		queryKey: infoKeys.method("blockDetails", params),
		queryFn: ({ signal }) => info.blockDetails(params, signal),
	};
}

export function useInfoBlockDetails<TData = BlockDetailsData>(
	params: UseInfoBlockDetailsParameters,
	options: UseInfoBlockDetailsOptions<TData> = {},
): UseInfoBlockDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getBlockDetailsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
