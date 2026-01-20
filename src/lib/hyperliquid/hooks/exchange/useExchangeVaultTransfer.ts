import type { ExchangeClient, VaultTransferParameters, VaultTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

export function getVaultTransferMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<VaultTransferData, VaultTransferParams> {
	return {
		mutationKey: createMutationKey("vaultTransfer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.vaultTransfer(params)),
	};
}

export function useExchangeVaultTransfer(
	options: UseExchangeVaultTransferOptions = {},
): UseExchangeVaultTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultTransferMutationOptions(exchange)));
}
