import type { InfoClient, SubAccounts2Parameters, SubAccounts2Response } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type SubAccounts2Data = SubAccounts2Response;
type SubAccounts2Params = SubAccounts2Parameters;

export type UseInfoSubAccounts2Parameters = SubAccounts2Params;
export type UseInfoSubAccounts2Options<TData = SubAccounts2Data> = QueryParameter<SubAccounts2Data, TData>;
export type UseInfoSubAccounts2ReturnType<TData = SubAccounts2Data> = UseQueryResult<TData, HyperliquidQueryError>;

export function getSubAccounts2QueryOptions(
	info: InfoClient,
	params: SubAccounts2Params,
): QueryOptions<SubAccounts2Data> {
	return {
		queryKey: infoKeys.method("subAccounts2", params),
		queryFn: ({ signal }) => info.subAccounts2(params, signal),
	};
}

export function useInfoSubAccounts2<TData = SubAccounts2Data>(
	params: UseInfoSubAccounts2Parameters,
	options: UseInfoSubAccounts2Options<TData> = {},
): UseInfoSubAccounts2ReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSubAccounts2QueryOptions(info, params);
	const enabled = computeEnabled(Boolean((params as { user?: string }).user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
