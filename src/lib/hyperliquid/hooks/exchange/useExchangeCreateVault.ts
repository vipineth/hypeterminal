import type { CreateVaultParameters, CreateVaultSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

export function getCreateVaultMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CreateVaultData, CreateVaultParams> {
	return {
		mutationKey: createMutationKey("createVault"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.createVault(params)),
	};
}

export function useExchangeCreateVault(options: UseExchangeCreateVaultOptions = {}): UseExchangeCreateVaultReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCreateVaultMutationOptions(exchange)));
}
