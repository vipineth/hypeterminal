import type { ExchangeClient, UsdSendParameters, UsdSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UsdSendData = UsdSendSuccessResponse;
type UsdSendParams = UsdSendParameters;

export type UseExchangeUsdSendOptions = MutationParameter<UsdSendData, UsdSendParams>;
export type UseExchangeUsdSendReturnType = UseMutationResult<UsdSendData, HyperliquidQueryError, UsdSendParams>;

interface UsdSendMutationContext {
	exchange: ExchangeClient | null;
}

export function getUsdSendMutationOptions(
	context: UsdSendMutationContext,
): MutationOptions<UsdSendData, UsdSendParams> {
	return {
		mutationKey: createMutationKey("usdSend"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.usdSend(params);
		},
	};
}

export function useExchangeUsdSend(options: UseExchangeUsdSendOptions = {}): UseExchangeUsdSendReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUsdSendMutationOptions({ exchange })));
}
