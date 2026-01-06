import type { UserFundingParameters, UserFundingResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UserFundingData = UserFundingResponse;
type UserFundingParams = UserFundingParameters;

export type UseInfoUserFundingParameters = UserFundingParams;
export type UseInfoUserFundingOptions<TData = UserFundingData> = QueryParameter<UserFundingData, TData>;
export type UseInfoUserFundingReturnType<TData = UserFundingData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoUserFunding<TData = UserFundingData>(
	params: UseInfoUserFundingParameters,
	options: UseInfoUserFundingOptions<TData> = {},
): UseInfoUserFundingReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("userFunding", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userFunding(params, signal),
	});
}
