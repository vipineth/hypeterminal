import type { InfoClient, VaultDetailsParameters, VaultDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type VaultDetailsData = VaultDetailsResponse;
type VaultDetailsParams = VaultDetailsParameters;

export type UseInfoVaultDetailsParameters = VaultDetailsParams;
export type UseInfoVaultDetailsOptions<TData = VaultDetailsData> = QueryParameter<VaultDetailsData, TData>;
export type UseInfoVaultDetailsReturnType<TData = VaultDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getVaultDetailsQueryOptions(
	info: InfoClient,
	params: VaultDetailsParams,
): QueryOptions<VaultDetailsData> {
	return {
		queryKey: infoKeys.method("vaultDetails", params),
		queryFn: ({ signal }) => info.vaultDetails(params, signal),
	};
}

export function useInfoVaultDetails<TData = VaultDetailsData>(
	params: UseInfoVaultDetailsParameters,
	options: UseInfoVaultDetailsOptions<TData> = {},
): UseInfoVaultDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getVaultDetailsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
