import type { VaultTransferParameters, VaultTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeVaultTransfer(
	options: UseExchangeVaultTransferOptions = {},
): UseExchangeVaultTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("vaultTransfer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.vaultTransfer(params);
		},
	});
}
