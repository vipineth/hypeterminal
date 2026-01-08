import type { CreateVaultParameters, CreateVaultSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CreateVaultData = CreateVaultSuccessResponse;
type CreateVaultParams = CreateVaultParameters;

export type UseExchangeCreateVaultOptions = MutationParameter<CreateVaultData, CreateVaultParams>;
export type UseExchangeCreateVaultReturnType = UseMutationResult<
	CreateVaultData,
	HyperliquidQueryError,
	CreateVaultParams
>;

export function useExchangeCreateVault(options: UseExchangeCreateVaultOptions = {}): UseExchangeCreateVaultReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("createVault"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.createVault(params);
		},
	});
}
