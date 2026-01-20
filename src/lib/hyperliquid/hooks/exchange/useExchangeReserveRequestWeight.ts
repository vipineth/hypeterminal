import type {
	ExchangeClient,
	ReserveRequestWeightParameters,
	ReserveRequestWeightSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
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

interface ReserveRequestWeightMutationContext {
	exchange: ExchangeClient | null;
}

export function getReserveRequestWeightMutationOptions(
	context: ReserveRequestWeightMutationContext,
): MutationOptions<ReserveRequestWeightData, ReserveRequestWeightParams> {
	return {
		mutationKey: createMutationKey("reserveRequestWeight"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.reserveRequestWeight(params);
		},
	};
}

export function useExchangeReserveRequestWeight(
	options: UseExchangeReserveRequestWeightOptions = {},
): UseExchangeReserveRequestWeightReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getReserveRequestWeightMutationOptions({ exchange })));
}
