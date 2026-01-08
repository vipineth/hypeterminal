import type { SubAccountsParameters, SubAccountsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SubAccountsData = SubAccountsResponse;
type SubAccountsParams = SubAccountsParameters;

export type UseInfoSubAccountsParameters = SubAccountsParams;
export type UseInfoSubAccountsOptions<TData = SubAccountsData> = QueryParameter<SubAccountsData, TData>;
export type UseInfoSubAccountsReturnType<TData = SubAccountsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoSubAccounts<TData = SubAccountsData>(
	params: UseInfoSubAccountsParameters,
	options: UseInfoSubAccountsOptions<TData> = {},
): UseInfoSubAccountsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("subAccounts", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.subAccounts(params, signal),
	});
}
