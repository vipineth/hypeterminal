import type { DelegationsParameters, DelegationsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type DelegationsData = DelegationsResponse;
type DelegationsParams = DelegationsParameters;

export type UseInfoDelegationsParameters = DelegationsParams;
export type UseInfoDelegationsOptions<TData = DelegationsData> = QueryParameter<DelegationsData, TData>;
export type UseInfoDelegationsReturnType<TData = DelegationsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoDelegations<TData = DelegationsData>(
	params: UseInfoDelegationsParameters,
	options: UseInfoDelegationsOptions<TData> = {},
): UseInfoDelegationsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("delegations", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.delegations(params, signal),
	});
}
