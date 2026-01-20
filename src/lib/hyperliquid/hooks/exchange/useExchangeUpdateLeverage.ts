import type { ExchangeClient, UpdateLeverageParameters, UpdateLeverageSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UpdateLeverageData = UpdateLeverageSuccessResponse;
type UpdateLeverageParams = UpdateLeverageParameters;

export type UseExchangeUpdateLeverageOptions = MutationParameter<UpdateLeverageData, UpdateLeverageParams>;
export type UseExchangeUpdateLeverageReturnType = UseMutationResult<
	UpdateLeverageData,
	HyperliquidQueryError,
	UpdateLeverageParams
>;

interface UpdateLeverageMutationContext {
	exchange: ExchangeClient | null;
}

export function getUpdateLeverageMutationOptions(
	context: UpdateLeverageMutationContext,
): MutationOptions<UpdateLeverageData, UpdateLeverageParams> {
	return {
		mutationKey: createMutationKey("updateLeverage"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.updateLeverage(params);
		},
	};
}

export function useExchangeUpdateLeverage(
	options: UseExchangeUpdateLeverageOptions = {},
): UseExchangeUpdateLeverageReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUpdateLeverageMutationOptions({ exchange })));
}
