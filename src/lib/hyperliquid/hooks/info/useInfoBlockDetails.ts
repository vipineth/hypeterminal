import type { BlockDetailsParameters, BlockDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type BlockDetailsData = BlockDetailsResponse;
type BlockDetailsParams = BlockDetailsParameters;

export type UseInfoBlockDetailsParameters = BlockDetailsParams;
export type UseInfoBlockDetailsOptions<TData = BlockDetailsData> = QueryParameter<BlockDetailsData, TData>;
export type UseInfoBlockDetailsReturnType<TData = BlockDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoBlockDetails<TData = BlockDetailsData>(
	params: UseInfoBlockDetailsParameters,
	options: UseInfoBlockDetailsOptions<TData> = {},
): UseInfoBlockDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("blockDetails", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.blockDetails(params, signal),
	});
}
