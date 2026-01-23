import type { ExchangeClient, UsdClassTransferParameters, UsdClassTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type UsdClassTransferData = UsdClassTransferSuccessResponse;
type UsdClassTransferParams = UsdClassTransferParameters;

export type UseExchangeUsdClassTransferOptions = MutationParameter<UsdClassTransferData, UsdClassTransferParams>;
export type UseExchangeUsdClassTransferReturnType = UseMutationResult<
	UsdClassTransferData,
	HyperliquidQueryError,
	UsdClassTransferParams
>;

export function getUsdClassTransferMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<UsdClassTransferData, UsdClassTransferParams> {
	return {
		mutationKey: createMutationKey("usdClassTransfer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.usdClassTransfer(params)),
	};
}

export function useExchangeUsdClassTransfer(
	options: UseExchangeUsdClassTransferOptions = {},
): UseExchangeUsdClassTransferReturnType {
	const { user } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUsdClassTransferMutationOptions(user)));
}
