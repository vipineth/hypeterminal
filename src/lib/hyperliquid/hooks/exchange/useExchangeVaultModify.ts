import type { ExchangeClient, VaultModifyParameters, VaultModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type VaultModifyData = VaultModifySuccessResponse;
type VaultModifyParams = VaultModifyParameters;

export type UseExchangeVaultModifyOptions = MutationParameter<VaultModifyData, VaultModifyParams>;
export type UseExchangeVaultModifyReturnType = UseMutationResult<
	VaultModifyData,
	HyperliquidQueryError,
	VaultModifyParams
>;

interface VaultModifyMutationContext {
	exchange: ExchangeClient | null;
}

export function getVaultModifyMutationOptions(
	context: VaultModifyMutationContext,
): MutationOptions<VaultModifyData, VaultModifyParams> {
	return {
		mutationKey: createMutationKey("vaultModify"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.vaultModify(params);
		},
	};
}

export function useExchangeVaultModify(options: UseExchangeVaultModifyOptions = {}): UseExchangeVaultModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getVaultModifyMutationOptions({ exchange })));
}
