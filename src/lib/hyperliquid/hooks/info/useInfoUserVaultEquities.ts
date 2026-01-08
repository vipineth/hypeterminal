import type { UserVaultEquitiesParameters, UserVaultEquitiesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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

export function useInfoUserVaultEquities<TData = UserVaultEquitiesData>(
	params: UseInfoUserVaultEquitiesParameters,
	options: UseInfoUserVaultEquitiesOptions<TData> = {},
): UseInfoUserVaultEquitiesReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("userVaultEquities", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userVaultEquities(params, signal),
	});
}
