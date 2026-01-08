import type { UpdateLeverageParameters, UpdateLeverageSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeUpdateLeverage(
	options: UseExchangeUpdateLeverageOptions = {},
): UseExchangeUpdateLeverageReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("updateLeverage"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.updateLeverage(params);
		},
	});
}
