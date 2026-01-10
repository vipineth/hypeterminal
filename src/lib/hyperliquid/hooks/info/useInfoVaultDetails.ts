import type { VaultDetailsParameters, VaultDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type VaultDetailsData = VaultDetailsResponse;
type VaultDetailsParams = VaultDetailsParameters;

export type UseInfoVaultDetailsParameters = VaultDetailsParams;
export type UseInfoVaultDetailsOptions<TData = VaultDetailsData> = QueryParameter<VaultDetailsData, TData>;
export type UseInfoVaultDetailsReturnType<TData = VaultDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoVaultDetails<TData = VaultDetailsData>(
	params: UseInfoVaultDetailsParameters,
	options: UseInfoVaultDetailsOptions<TData> = {},
): UseInfoVaultDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("vaultDetails", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.vaultDetails(params, signal),
	});
}
