import type { TwapOrderParameters, TwapOrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TwapOrderData = TwapOrderSuccessResponse;
type TwapOrderParams = TwapOrderParameters;

export type UseExchangeTwapOrderOptions = MutationParameter<TwapOrderData, TwapOrderParams>;
export type UseExchangeTwapOrderReturnType = UseMutationResult<TwapOrderData, HyperliquidQueryError, TwapOrderParams>;

export function useExchangeTwapOrder(options: UseExchangeTwapOrderOptions = {}): UseExchangeTwapOrderReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("twapOrder"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.twapOrder(params);
		},
	});
}
