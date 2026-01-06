import type { ReserveRequestWeightParameters, ReserveRequestWeightSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeReserveRequestWeight(
	options: UseExchangeReserveRequestWeightOptions = {},
): UseExchangeReserveRequestWeightReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("reserveRequestWeight"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.reserveRequestWeight(params);
		},
	});
}
