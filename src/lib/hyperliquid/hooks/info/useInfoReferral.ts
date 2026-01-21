import type { InfoClient, ReferralParameters, ReferralResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ReferralData = ReferralResponse;
type ReferralParams = ReferralParameters;

export type UseInfoReferralParameters = ReferralParams;
export type UseInfoReferralOptions<TData = ReferralData> = QueryParameter<ReferralData, TData>;
export type UseInfoReferralReturnType<TData = ReferralData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getReferralQueryOptions(info: InfoClient, params: ReferralParams): QueryOptions<ReferralData> {
	return {
		queryKey: infoKeys.method("referral", params),
		queryFn: ({ signal }) => info.referral(params, signal),
	};
}

export function useInfoReferral<TData = ReferralData>(
	params: UseInfoReferralParameters,
	options: UseInfoReferralOptions<TData> = {},
): UseInfoReferralReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getReferralQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
