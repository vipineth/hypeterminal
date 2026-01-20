import type { ExchangeClient, TwapOrderParameters, TwapOrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TwapOrderData = TwapOrderSuccessResponse;
type TwapOrderParams = TwapOrderParameters;

export type UseExchangeTwapOrderOptions = MutationParameter<TwapOrderData, TwapOrderParams>;
export type UseExchangeTwapOrderReturnType = UseMutationResult<TwapOrderData, HyperliquidQueryError, TwapOrderParams>;

interface TwapOrderMutationContext {
	exchange: ExchangeClient | null;
}

export function getTwapOrderMutationOptions(
	context: TwapOrderMutationContext,
): MutationOptions<TwapOrderData, TwapOrderParams> {
	return {
		mutationKey: createMutationKey("twapOrder"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.twapOrder(params);
		},
	};
}

export function useExchangeTwapOrder(options: UseExchangeTwapOrderOptions = {}): UseExchangeTwapOrderReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTwapOrderMutationOptions({ exchange })));
}
