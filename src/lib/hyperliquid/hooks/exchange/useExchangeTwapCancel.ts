import type { ExchangeClient, TwapCancelParameters, TwapCancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TwapCancelData = TwapCancelSuccessResponse;
type TwapCancelParams = TwapCancelParameters;

export type UseExchangeTwapCancelOptions = MutationParameter<TwapCancelData, TwapCancelParams>;
export type UseExchangeTwapCancelReturnType = UseMutationResult<
	TwapCancelData,
	HyperliquidQueryError,
	TwapCancelParams
>;

export function getTwapCancelMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<TwapCancelData, TwapCancelParams> {
	return {
		mutationKey: createMutationKey("twapCancel"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.twapCancel(params)),
	};
}

export function useExchangeTwapCancel(options: UseExchangeTwapCancelOptions = {}): UseExchangeTwapCancelReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTwapCancelMutationOptions(trading)));
}
