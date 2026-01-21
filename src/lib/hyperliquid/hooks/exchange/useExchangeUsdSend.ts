import type { ExchangeClient, UsdSendParameters, UsdSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
	const { admin } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUsdSendMutationOptions(admin)));
}
