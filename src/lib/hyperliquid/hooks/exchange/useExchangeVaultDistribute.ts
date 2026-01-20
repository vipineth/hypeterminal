import type { ExchangeClient, VaultDistributeParameters, VaultDistributeSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type VaultDistributeData = VaultDistributeSuccessResponse;
type VaultDistributeParams = VaultDistributeParameters;

export type UseExchangeVaultDistributeOptions = MutationParameter<VaultDistributeData, VaultDistributeParams>;
export type UseExchangeVaultDistributeReturnType = UseMutationResult<
	VaultDistributeData,
	HyperliquidQueryError,
	VaultDistributeParams
>;

interface VaultDistributeMutationContext {
	exchange: ExchangeClient | null;
}

export function getVaultDistributeMutationOptions(
	context: VaultDistributeMutationContext,
): MutationOptions<VaultDistributeData, VaultDistributeParams> {
	return {
		mutationKey: createMutationKey("vaultDistribute"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.vaultDistribute(params);
		},
	};
}

export function useExchangeVaultDistribute(
	options: UseExchangeVaultDistributeOptions = {},
): UseExchangeVaultDistributeReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultDistributeMutationOptions({ exchange })));
}
