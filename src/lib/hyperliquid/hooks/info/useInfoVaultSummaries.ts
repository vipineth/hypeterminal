import type { InfoClient, VaultSummariesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type VaultSummariesData = VaultSummariesResponse;

export type UseInfoVaultSummariesOptions<TData = VaultSummariesData> = QueryParameter<VaultSummariesData, TData>;
export type UseInfoVaultSummariesReturnType<TData = VaultSummariesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getVaultSummariesQueryOptions(info: InfoClient): QueryOptions<VaultSummariesData> {
	return {
		queryKey: infoKeys.method("vaultSummaries"),
		queryFn: ({ signal }) => info.vaultSummaries(signal),
	};
}

export function useInfoVaultSummaries<TData = VaultSummariesData>(
	options: UseInfoVaultSummariesOptions<TData> = {},
): UseInfoVaultSummariesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getVaultSummariesQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
