import type { ExchangeClient, SpotSendParameters, SpotSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotSendData = SpotSendSuccessResponse;
type SpotSendParams = SpotSendParameters;

export type UseExchangeSpotSendOptions = MutationParameter<SpotSendData, SpotSendParams>;
export type UseExchangeSpotSendReturnType = UseMutationResult<SpotSendData, HyperliquidQueryError, SpotSendParams>;

interface SpotSendMutationContext {
	exchange: ExchangeClient | null;
}

export function getSpotSendMutationOptions(
	context: SpotSendMutationContext,
): MutationOptions<SpotSendData, SpotSendParams> {
	return {
		mutationKey: createMutationKey("spotSend"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.spotSend(params);
		},
	};
}

export function useExchangeSpotSend(options: UseExchangeSpotSendOptions = {}): UseExchangeSpotSendReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotSendMutationOptions({ exchange })));
}
