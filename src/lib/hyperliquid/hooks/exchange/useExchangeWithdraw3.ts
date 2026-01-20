import type { ExchangeClient, Withdraw3Parameters, Withdraw3SuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type Withdraw3Data = Withdraw3SuccessResponse;
type Withdraw3Params = Withdraw3Parameters;

export type UseExchangeWithdraw3Options = MutationParameter<Withdraw3Data, Withdraw3Params>;
export type UseExchangeWithdraw3ReturnType = UseMutationResult<Withdraw3Data, HyperliquidQueryError, Withdraw3Params>;

interface Withdraw3MutationContext {
	exchange: ExchangeClient | null;
}

export function getWithdraw3MutationOptions(
	context: Withdraw3MutationContext,
): MutationOptions<Withdraw3Data, Withdraw3Params> {
	return {
		mutationKey: createMutationKey("withdraw3"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.withdraw3(params);
		},
	};
}

export function useExchangeWithdraw3(options: UseExchangeWithdraw3Options = {}): UseExchangeWithdraw3ReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getWithdraw3MutationOptions({ exchange })));
}
