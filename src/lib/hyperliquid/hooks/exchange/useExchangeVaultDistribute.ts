import type { VaultDistributeParameters, VaultDistributeSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeVaultDistribute(
	options: UseExchangeVaultDistributeOptions = {},
): UseExchangeVaultDistributeReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("vaultDistribute"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.vaultDistribute(params);
		},
	});
}
