import type { CancelParameters, CancelSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CancelData = CancelSuccessResponse;
type CancelParams = CancelParameters;

export type UseExchangeCancelOptions = MutationParameter<CancelData, CancelParams>;
export type UseExchangeCancelReturnType = UseMutationResult<CancelData, HyperliquidQueryError, CancelParams>;

interface CancelMutationContext {
	exchange: ExchangeClient | null;
}

export function getCancelMutationOptions(
	context: CancelMutationContext,
	clientKey?: string,
): MutationOptions<CancelData, CancelParams> {
	return {
		mutationKey: createMutationKey("cancel", clientKey),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.cancel(params);
		},
	};
}

export function useExchangeCancel(options: UseExchangeCancelOptions = {}): UseExchangeCancelReturnType {
	const { exchange } = useHyperliquidClients();
	const { clientKey } = useHyperliquid();

	return useMutation(mergeMutationOptions(options, getCancelMutationOptions({ exchange }, clientKey)));
}
