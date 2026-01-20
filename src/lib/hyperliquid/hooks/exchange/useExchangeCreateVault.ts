import type { CreateVaultParameters, CreateVaultSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface CreateVaultMutationContext {
	exchange: ExchangeClient | null;
}

export function getCreateVaultMutationOptions(
	context: CreateVaultMutationContext,
): MutationOptions<CreateVaultData, CreateVaultParams> {
	return {
		mutationKey: createMutationKey("createVault"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.createVault(params);
		},
	};
}

export function useExchangeCreateVault(options: UseExchangeCreateVaultOptions = {}): UseExchangeCreateVaultReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCreateVaultMutationOptions({ exchange })));
}
