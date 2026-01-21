import type { ExchangeClient, SpotSendParameters, SpotSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type SpotSendData = SpotSendSuccessResponse;
type SpotSendParams = SpotSendParameters;

export type UseExchangeSpotSendOptions = MutationParameter<SpotSendData, SpotSendParams>;
export type UseExchangeSpotSendReturnType = UseMutationResult<SpotSendData, HyperliquidQueryError, SpotSendParams>;

export function getSpotSendMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SpotSendData, SpotSendParams> {
	return {
		mutationKey: createMutationKey("spotSend"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.spotSend(params)),
	};
}

export function useExchangeSpotSend(options: UseExchangeSpotSendOptions = {}): UseExchangeSpotSendReturnType {
	const { admin } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotSendMutationOptions(admin)));
}
