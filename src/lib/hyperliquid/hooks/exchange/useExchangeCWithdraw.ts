import type { CWithdrawParameters, CWithdrawSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CWithdrawData = CWithdrawSuccessResponse;
type CWithdrawParams = CWithdrawParameters;

export type UseExchangeCWithdrawOptions = MutationParameter<CWithdrawData, CWithdrawParams>;
export type UseExchangeCWithdrawReturnType = UseMutationResult<CWithdrawData, HyperliquidQueryError, CWithdrawParams>;

export function getCWithdrawMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CWithdrawData, CWithdrawParams> {
	return {
		mutationKey: createMutationKey("cWithdraw"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.cWithdraw(params);
		},
	};
}

export function useExchangeCWithdraw(options: UseExchangeCWithdrawOptions = {}): UseExchangeCWithdrawReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCWithdrawMutationOptions(exchange)));
}
