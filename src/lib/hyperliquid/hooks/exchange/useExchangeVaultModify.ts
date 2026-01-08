import type { VaultModifyParameters, VaultModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeVaultModify(options: UseExchangeVaultModifyOptions = {}): UseExchangeVaultModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("vaultModify"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.vaultModify(params);
		},
	});
}
