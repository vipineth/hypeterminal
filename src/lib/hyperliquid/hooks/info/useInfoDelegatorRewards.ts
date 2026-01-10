import type { DelegatorRewardsParameters, DelegatorRewardsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type DelegatorRewardsData = DelegatorRewardsResponse;
type DelegatorRewardsParams = DelegatorRewardsParameters;

export type UseInfoDelegatorRewardsParameters = DelegatorRewardsParams;
export type UseInfoDelegatorRewardsOptions<TData = DelegatorRewardsData> = QueryParameter<DelegatorRewardsData, TData>;
export type UseInfoDelegatorRewardsReturnType<TData = DelegatorRewardsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoDelegatorRewards<TData = DelegatorRewardsData>(
	params: UseInfoDelegatorRewardsParameters,
	options: UseInfoDelegatorRewardsOptions<TData> = {},
): UseInfoDelegatorRewardsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("delegatorRewards", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.delegatorRewards(params, signal),
	});
}
