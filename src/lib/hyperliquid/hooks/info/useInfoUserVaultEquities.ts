import type { InfoClient, UserVaultEquitiesParameters, UserVaultEquitiesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type UserVaultEquitiesData = UserVaultEquitiesResponse;
type UserVaultEquitiesParams = UserVaultEquitiesParameters;

export type UseInfoUserVaultEquitiesParameters = UserVaultEquitiesParams;
export type UseInfoUserVaultEquitiesOptions<TData = UserVaultEquitiesData> = QueryParameter<
	UserVaultEquitiesData,
	TData
>;
export type UseInfoUserVaultEquitiesReturnType<TData = UserVaultEquitiesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getUserVaultEquitiesQueryOptions(
	info: InfoClient,
	params: UserVaultEquitiesParams,
): QueryOptions<UserVaultEquitiesData> {
	return {
		queryKey: infoKeys.method("userVaultEquities", params),
		queryFn: ({ signal }) => info.userVaultEquities(params, signal),
	};
}

export function useInfoUserVaultEquities<TData = UserVaultEquitiesData>(
	params: UseInfoUserVaultEquitiesParameters,
	options: UseInfoUserVaultEquitiesOptions<TData> = {},
): UseInfoUserVaultEquitiesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserVaultEquitiesQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
