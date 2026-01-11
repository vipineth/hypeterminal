import type { ReferralParameters, ReferralResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ReferralData = ReferralResponse;
type ReferralParams = ReferralParameters;

export type UseInfoReferralParameters = ReferralParams;
export type UseInfoReferralOptions<TData = ReferralData> = QueryParameter<ReferralData, TData>;
export type UseInfoReferralReturnType<TData = ReferralData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoReferral<TData = ReferralData>(
	params: UseInfoReferralParameters,
	options: UseInfoReferralOptions<TData> = {},
): UseInfoReferralReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("referral", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.referral(params, signal),
	});
}
