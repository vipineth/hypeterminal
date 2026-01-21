import type { ExchangeClient, VaultDistributeParameters, VaultDistributeSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type VaultDistributeData = VaultDistributeSuccessResponse;
type VaultDistributeParams = VaultDistributeParameters;

export type UseExchangeVaultDistributeOptions = MutationParameter<VaultDistributeData, VaultDistributeParams>;
export type UseExchangeVaultDistributeReturnType = UseMutationResult<
	VaultDistributeData,
	HyperliquidQueryError,
	VaultDistributeParams
>;

export function getVaultDistributeMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<VaultDistributeData, VaultDistributeParams> {
	return {
		mutationKey: createMutationKey("vaultDistribute"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.vaultDistribute(params)),
	};
}

export function useExchangeVaultDistribute(
	options: UseExchangeVaultDistributeOptions = {},
): UseExchangeVaultDistributeReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultDistributeMutationOptions(trading)));
}
