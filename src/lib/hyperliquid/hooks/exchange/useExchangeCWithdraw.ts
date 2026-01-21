import type { CWithdrawParameters, CWithdrawSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type CWithdrawData = CWithdrawSuccessResponse;
type CWithdrawParams = CWithdrawParameters;

export type UseExchangeCWithdrawOptions = MutationParameter<CWithdrawData, CWithdrawParams>;
export type UseExchangeCWithdrawReturnType = UseMutationResult<CWithdrawData, HyperliquidQueryError, CWithdrawParams>;

export function getCWithdrawMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CWithdrawData, CWithdrawParams> {
	return {
		mutationKey: createMutationKey("cWithdraw"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.cWithdraw(params)),
	};
}

export function useExchangeCWithdraw(options: UseExchangeCWithdrawOptions = {}): UseExchangeCWithdrawReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCWithdrawMutationOptions(trading)));
}
