import type { ExchangeClient, VaultModifyParameters, VaultModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type VaultModifyData = VaultModifySuccessResponse;
type VaultModifyParams = VaultModifyParameters;

export type UseExchangeVaultModifyOptions = MutationParameter<VaultModifyData, VaultModifyParams>;
export type UseExchangeVaultModifyReturnType = UseMutationResult<
	VaultModifyData,
	HyperliquidQueryError,
	VaultModifyParams
>;

export function getVaultModifyMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<VaultModifyData, VaultModifyParams> {
	return {
		mutationKey: createMutationKey("vaultModify"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.vaultModify(params)),
	};
}

export function useExchangeVaultModify(options: UseExchangeVaultModifyOptions = {}): UseExchangeVaultModifyReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultModifyMutationOptions(trading)));
}
