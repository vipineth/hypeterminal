import type { DelegatorRewardsParameters, DelegatorRewardsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type DelegatorRewardsData = DelegatorRewardsResponse;
type DelegatorRewardsParams = DelegatorRewardsParameters;

export type UseInfoDelegatorRewardsParameters = DelegatorRewardsParams;
export type UseInfoDelegatorRewardsOptions<TData = DelegatorRewardsData> = QueryParameter<DelegatorRewardsData, TData>;
export type UseInfoDelegatorRewardsReturnType<TData = DelegatorRewardsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getDelegatorRewardsQueryOptions(
	info: InfoClient,
	params: DelegatorRewardsParams,
): QueryOptions<DelegatorRewardsData> {
	return {
		queryKey: infoKeys.method("delegatorRewards", params),
		queryFn: ({ signal }) => info.delegatorRewards(params, signal),
	};
}

export function useInfoDelegatorRewards<TData = DelegatorRewardsData>(
	params: UseInfoDelegatorRewardsParameters,
	options: UseInfoDelegatorRewardsOptions<TData> = {},
): UseInfoDelegatorRewardsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getDelegatorRewardsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
