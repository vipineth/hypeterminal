import type { ExchangeClient, TwapCancelParameters, TwapCancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface TwapCancelMutationContext {
	exchange: ExchangeClient | null;
}

export function getTwapCancelMutationOptions(
	context: TwapCancelMutationContext,
): MutationOptions<TwapCancelData, TwapCancelParams> {
	return {
		mutationKey: createMutationKey("twapCancel"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.twapCancel(params);
		},
	};
}

export function useExchangeTwapCancel(options: UseExchangeTwapCancelOptions = {}): UseExchangeTwapCancelReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getTwapCancelMutationOptions({ exchange })));
}
