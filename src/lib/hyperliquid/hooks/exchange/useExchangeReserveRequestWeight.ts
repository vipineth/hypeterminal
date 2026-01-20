import type {
	ExchangeClient,
	ReserveRequestWeightParameters,
	ReserveRequestWeightSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.reserveRequestWeight(params);
		},
	};
}

export function useExchangeReserveRequestWeight(
	options: UseExchangeReserveRequestWeightOptions = {},
): UseExchangeReserveRequestWeightReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getReserveRequestWeightMutationOptions(exchange)));
}
