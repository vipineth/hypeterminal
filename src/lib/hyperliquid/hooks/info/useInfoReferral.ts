import type { ReferralParameters, ReferralResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ReferralData = ReferralResponse;
type ReferralParams = ReferralParameters;

export type UseInfoReferralParameters = ReferralParams;
export type UseInfoReferralOptions<TData = ReferralData> = QueryParameter<ReferralData, TData>;
export type UseInfoReferralReturnType<TData = ReferralData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoReferral<TData = ReferralData>(
	params: UseInfoReferralParameters,
	options: UseInfoReferralOptions<TData> = {},
): UseInfoReferralReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("referral", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.referral(params, signal),
	});
}
