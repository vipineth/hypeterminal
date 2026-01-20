import type { CreateSubAccountParameters, CreateSubAccountSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CreateSubAccountData = CreateSubAccountSuccessResponse;
type CreateSubAccountParams = CreateSubAccountParameters;

export type UseExchangeCreateSubAccountOptions = MutationParameter<CreateSubAccountData, CreateSubAccountParams>;
export type UseExchangeCreateSubAccountReturnType = UseMutationResult<
	CreateSubAccountData,
	HyperliquidQueryError,
	CreateSubAccountParams
>;

interface CreateSubAccountMutationContext {
	exchange: ExchangeClient | null;
}

export function getCreateSubAccountMutationOptions(
	context: CreateSubAccountMutationContext,
): MutationOptions<CreateSubAccountData, CreateSubAccountParams> {
	return {
		mutationKey: createMutationKey("createSubAccount"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.createSubAccount(params);
		},
	};
}

export function useExchangeCreateSubAccount(
	options: UseExchangeCreateSubAccountOptions = {},
): UseExchangeCreateSubAccountReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCreateSubAccountMutationOptions({ exchange })));
}
