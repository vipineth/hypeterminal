import type {
	ExchangeClient,
	ReserveRequestWeightParameters,
	ReserveRequestWeightSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type ReserveRequestWeightData = ReserveRequestWeightSuccessResponse;
type ReserveRequestWeightParams = ReserveRequestWeightParameters;

export type UseExchangeReserveRequestWeightOptions = MutationParameter<
	ReserveRequestWeightData,
	ReserveRequestWeightParams
>;
export type UseExchangeReserveRequestWeightReturnType = UseMutationResult<
	ReserveRequestWeightData,
	HyperliquidQueryError,
	ReserveRequestWeightParams
>;

export function getReserveRequestWeightMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ReserveRequestWeightData, ReserveRequestWeightParams> {
	return {
		mutationKey: createMutationKey("reserveRequestWeight"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.reserveRequestWeight(params)),
	};
}

export function useExchangeReserveRequestWeight(
	options: UseExchangeReserveRequestWeightOptions = {},
): UseExchangeReserveRequestWeightReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getReserveRequestWeightMutationOptions(trading)));
}
