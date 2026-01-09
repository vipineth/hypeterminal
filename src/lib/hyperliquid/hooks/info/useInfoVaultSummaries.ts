import type { VaultSummariesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type VaultSummariesData = VaultSummariesResponse;

export type UseInfoVaultSummariesOptions<TData = VaultSummariesData> = QueryParameter<VaultSummariesData, TData>;
export type UseInfoVaultSummariesReturnType<TData = VaultSummariesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoVaultSummaries<TData = VaultSummariesData>(
	options: UseInfoVaultSummariesOptions<TData> = {},
): UseInfoVaultSummariesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("vaultSummaries");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.vaultSummaries(signal),
	});
}
