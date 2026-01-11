import type { SubAccounts2Parameters, SubAccounts2Response } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SubAccounts2Data = SubAccounts2Response;
type SubAccounts2Params = SubAccounts2Parameters;

export type UseInfoSubAccounts2Parameters = SubAccounts2Params;
export type UseInfoSubAccounts2Options<TData = SubAccounts2Data> = QueryParameter<SubAccounts2Data, TData>;
export type UseInfoSubAccounts2ReturnType<TData = SubAccounts2Data> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoSubAccounts2<TData = SubAccounts2Data>(
	params: UseInfoSubAccounts2Parameters,
	options: UseInfoSubAccounts2Options<TData> = {},
): UseInfoSubAccounts2ReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("subAccounts2", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.subAccounts2(params, signal),
	});
}
