import type { ExchangeClient, UsdClassTransferParameters, UsdClassTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UsdClassTransferData = UsdClassTransferSuccessResponse;
type UsdClassTransferParams = UsdClassTransferParameters;

export type UseExchangeUsdClassTransferOptions = MutationParameter<UsdClassTransferData, UsdClassTransferParams>;
export type UseExchangeUsdClassTransferReturnType = UseMutationResult<
	UsdClassTransferData,
	HyperliquidQueryError,
	UsdClassTransferParams
>;

interface UsdClassTransferMutationContext {
	exchange: ExchangeClient | null;
}

export function getUsdClassTransferMutationOptions(
	context: UsdClassTransferMutationContext,
): MutationOptions<UsdClassTransferData, UsdClassTransferParams> {
	return {
		mutationKey: createMutationKey("usdClassTransfer"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.usdClassTransfer(params);
		},
	};
}

export function useExchangeUsdClassTransfer(
	options: UseExchangeUsdClassTransferOptions = {},
): UseExchangeUsdClassTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUsdClassTransferMutationOptions({ exchange })));
}
