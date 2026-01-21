import type { CreateSubAccountParameters, CreateSubAccountSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type CreateSubAccountData = CreateSubAccountSuccessResponse;
type CreateSubAccountParams = CreateSubAccountParameters;

export type UseExchangeCreateSubAccountOptions = MutationParameter<CreateSubAccountData, CreateSubAccountParams>;
export type UseExchangeCreateSubAccountReturnType = UseMutationResult<
	CreateSubAccountData,
	HyperliquidQueryError,
	CreateSubAccountParams
>;

export function getCreateSubAccountMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CreateSubAccountData, CreateSubAccountParams> {
	return {
		mutationKey: createMutationKey("createSubAccount"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.createSubAccount(params)),
	};
}

export function useExchangeCreateSubAccount(
	options: UseExchangeCreateSubAccountOptions = {},
): UseExchangeCreateSubAccountReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCreateSubAccountMutationOptions(trading)));
}
