import type { CDepositParameters, CDepositSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type CDepositData = CDepositSuccessResponse;
type CDepositParams = CDepositParameters;

export type UseExchangeCDepositOptions = MutationParameter<CDepositData, CDepositParams>;
export type UseExchangeCDepositReturnType = UseMutationResult<CDepositData, HyperliquidQueryError, CDepositParams>;

export function getCDepositMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CDepositData, CDepositParams> {
	return {
		mutationKey: createMutationKey("cDeposit"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.cDeposit(params)),
	};
}

export function useExchangeCDeposit(options: UseExchangeCDepositOptions = {}): UseExchangeCDepositReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCDepositMutationOptions(trading)));
}
