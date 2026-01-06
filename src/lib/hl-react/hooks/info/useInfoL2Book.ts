import type { L2BookParameters, L2BookResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type L2BookData = L2BookResponse;
type L2BookParams = L2BookParameters;

export type UseInfoL2BookParameters = L2BookParams;
export type UseInfoL2BookOptions<TData = L2BookData> = QueryParameter<L2BookData, TData>;
export type UseInfoL2BookReturnType<TData = L2BookData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoL2Book<TData = L2BookData>(
	params: UseInfoL2BookParameters,
	options: UseInfoL2BookOptions<TData> = {},
): UseInfoL2BookReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("l2Book", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.l2Book(params, signal),
	});
}
