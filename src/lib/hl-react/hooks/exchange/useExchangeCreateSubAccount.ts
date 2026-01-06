import type { CreateSubAccountParameters, CreateSubAccountSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeCreateSubAccount(
	options: UseExchangeCreateSubAccountOptions = {},
): UseExchangeCreateSubAccountReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("createSubAccount"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.createSubAccount(params);
		},
	});
}
