import type { ExchangeClient, UpdateLeverageParameters, UpdateLeverageSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type UpdateLeverageData = UpdateLeverageSuccessResponse;
type UpdateLeverageParams = UpdateLeverageParameters;

export type UseExchangeUpdateLeverageOptions = MutationParameter<UpdateLeverageData, UpdateLeverageParams>;
export type UseExchangeUpdateLeverageReturnType = UseMutationResult<
	UpdateLeverageData,
	HyperliquidQueryError,
	UpdateLeverageParams
>;

export function getUpdateLeverageMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<UpdateLeverageData, UpdateLeverageParams> {
	return {
		mutationKey: createMutationKey("updateLeverage"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.updateLeverage(params)),
	};
}

export function useExchangeUpdateLeverage(
	options: UseExchangeUpdateLeverageOptions = {},
): UseExchangeUpdateLeverageReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUpdateLeverageMutationOptions(trading)));
}
