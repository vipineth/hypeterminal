import type { CancelParameters, CancelSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CancelData = CancelSuccessResponse;
type CancelParams = CancelParameters;

export type UseExchangeCancelOptions = MutationParameter<CancelData, CancelParams>;
export type UseExchangeCancelReturnType = UseMutationResult<CancelData, HyperliquidQueryError, CancelParams>;

export function getCancelMutationOptions(
	exchange: ExchangeClient | null,
	clientKey?: string,
): MutationOptions<CancelData, CancelParams> {
	return {
		mutationKey: createMutationKey("cancel", clientKey),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.cancel(params)),
	};
}

export function useExchangeCancel(options: UseExchangeCancelOptions = {}): UseExchangeCancelReturnType {
	const { trading } = useHyperliquidClients();
	const { clientKey } = useHyperliquid();

	return useMutation(mergeMutationOptions(options, getCancelMutationOptions(trading, clientKey)));
}
