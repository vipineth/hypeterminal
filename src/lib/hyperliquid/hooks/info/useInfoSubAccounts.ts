import type { InfoClient, SubAccountsParameters, SubAccountsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SubAccountsData = SubAccountsResponse;
type SubAccountsParams = SubAccountsParameters;

export type UseInfoSubAccountsParameters = SubAccountsParams;
export type UseInfoSubAccountsOptions<TData = SubAccountsData> = QueryParameter<SubAccountsData, TData>;
export type UseInfoSubAccountsReturnType<TData = SubAccountsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getSubAccountsQueryOptions(info: InfoClient, params: SubAccountsParams): QueryOptions<SubAccountsData> {
	return {
		queryKey: infoKeys.method("subAccounts", params),
		queryFn: ({ signal }) => info.subAccounts(params, signal),
	};
}

export function useInfoSubAccounts<TData = SubAccountsData>(
	params: UseInfoSubAccountsParameters,
	options: UseInfoSubAccountsOptions<TData> = {},
): UseInfoSubAccountsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSubAccountsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
