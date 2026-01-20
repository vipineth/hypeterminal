import type { ExchangeClient, TwapOrderParameters, TwapOrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TwapOrderData = TwapOrderSuccessResponse;
type TwapOrderParams = TwapOrderParameters;

export type UseExchangeTwapOrderOptions = MutationParameter<TwapOrderData, TwapOrderParams>;
export type UseExchangeTwapOrderReturnType = UseMutationResult<TwapOrderData, HyperliquidQueryError, TwapOrderParams>;

export function getTwapOrderMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<TwapOrderData, TwapOrderParams> {
	return {
		mutationKey: createMutationKey("twapOrder"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.twapOrder(params)),
	};
}

export function useExchangeTwapOrder(options: UseExchangeTwapOrderOptions = {}): UseExchangeTwapOrderReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTwapOrderMutationOptions(exchange)));
}
