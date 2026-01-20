import type { CDepositParameters, CDepositSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CDepositData = CDepositSuccessResponse;
type CDepositParams = CDepositParameters;

export type UseExchangeCDepositOptions = MutationParameter<CDepositData, CDepositParams>;
export type UseExchangeCDepositReturnType = UseMutationResult<CDepositData, HyperliquidQueryError, CDepositParams>;

interface CDepositMutationContext {
	exchange: ExchangeClient | null;
}

export function getCDepositMutationOptions(
	context: CDepositMutationContext,
): MutationOptions<CDepositData, CDepositParams> {
	return {
		mutationKey: createMutationKey("cDeposit"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.cDeposit(params);
		},
	};
}

export function useExchangeCDeposit(options: UseExchangeCDepositOptions = {}): UseExchangeCDepositReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCDepositMutationOptions({ exchange })));
}
