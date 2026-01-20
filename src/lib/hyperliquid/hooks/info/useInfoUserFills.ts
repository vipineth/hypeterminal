import type { InfoClient, UserFillsParameters, UserFillsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserFillsData = UserFillsResponse;
type UserFillsParams = UserFillsParameters;

export type UseInfoUserFillsParameters = UserFillsParams;
export type UseInfoUserFillsOptions<TData = UserFillsData> = QueryParameter<UserFillsData, TData>;
export type UseInfoUserFillsReturnType<TData = UserFillsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getUserFillsQueryOptions(info: InfoClient, params: UserFillsParams): QueryOptions<UserFillsData> {
	return {
		queryKey: infoKeys.method("userFills", params),
		queryFn: ({ signal }) => info.userFills(params, signal),
	};
}

export function useInfoUserFills<TData = UserFillsData>(
	params: UseInfoUserFillsParameters,
	options: UseInfoUserFillsOptions<TData> = {},
): UseInfoUserFillsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserFillsQueryOptions(info, params);
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
