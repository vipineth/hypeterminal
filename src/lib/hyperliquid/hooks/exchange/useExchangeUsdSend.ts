import type { ExchangeClient, UsdSendParameters, UsdSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UsdSendData = UsdSendSuccessResponse;
type UsdSendParams = UsdSendParameters;

export type UseExchangeUsdSendOptions = MutationParameter<UsdSendData, UsdSendParams>;
export type UseExchangeUsdSendReturnType = UseMutationResult<UsdSendData, HyperliquidQueryError, UsdSendParams>;

export function getUsdSendMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<UsdSendData, UsdSendParams> {
	return {
		mutationKey: createMutationKey("usdSend"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.usdSend(params)),
	};
}

export function useExchangeUsdSend(options: UseExchangeUsdSendOptions = {}): UseExchangeUsdSendReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUsdSendMutationOptions(exchange)));
}
