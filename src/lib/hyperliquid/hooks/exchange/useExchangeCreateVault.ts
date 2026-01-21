import type { CreateVaultParameters, CreateVaultSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCreateVaultMutationOptions(trading)));
}
