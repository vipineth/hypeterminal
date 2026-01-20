import type { InfoClient, UserFundingParameters, UserFundingResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserFundingData = UserFundingResponse;
type UserFundingParams = UserFundingParameters;

export type UseInfoUserFundingParameters = UserFundingParams;
export type UseInfoUserFundingOptions<TData = UserFundingData> = QueryParameter<UserFundingData, TData>;
export type UseInfoUserFundingReturnType<TData = UserFundingData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getUserFundingQueryOptions(info: InfoClient, params: UserFundingParams): QueryOptions<UserFundingData> {
	return {
		queryKey: infoKeys.method("userFunding", params),
		queryFn: ({ signal }) => info.userFunding(params, signal),
	};
}

export function useInfoUserFunding<TData = UserFundingData>(
	params: UseInfoUserFundingParameters,
	options: UseInfoUserFundingOptions<TData> = {},
): UseInfoUserFundingReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserFundingQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
