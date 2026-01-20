import type { ExchangeClient, VaultTransferParameters, VaultTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type VaultTransferData = VaultTransferSuccessResponse;
type VaultTransferParams = VaultTransferParameters;

export type UseExchangeVaultTransferOptions = MutationParameter<VaultTransferData, VaultTransferParams>;
export type UseExchangeVaultTransferReturnType = UseMutationResult<
	VaultTransferData,
	HyperliquidQueryError,
	VaultTransferParams
>;

interface VaultTransferMutationContext {
	exchange: ExchangeClient | null;
}

export function getVaultTransferMutationOptions(
	context: VaultTransferMutationContext,
): MutationOptions<VaultTransferData, VaultTransferParams> {
	return {
		mutationKey: createMutationKey("vaultTransfer"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.vaultTransfer(params);
		},
	};
}

export function useExchangeVaultTransfer(
	options: UseExchangeVaultTransferOptions = {},
): UseExchangeVaultTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultTransferMutationOptions({ exchange })));
}
