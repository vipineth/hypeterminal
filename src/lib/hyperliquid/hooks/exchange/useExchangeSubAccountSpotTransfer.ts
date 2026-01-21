import type {
	ExchangeClient,
	SubAccountSpotTransferParameters,
	SubAccountSpotTransferSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type SubAccountSpotTransferData = SubAccountSpotTransferSuccessResponse;
type SubAccountSpotTransferParams = SubAccountSpotTransferParameters;

export type UseExchangeSubAccountSpotTransferOptions = MutationParameter<
	SubAccountSpotTransferData,
	SubAccountSpotTransferParams
>;
export type UseExchangeSubAccountSpotTransferReturnType = UseMutationResult<
	SubAccountSpotTransferData,
	HyperliquidQueryError,
	SubAccountSpotTransferParams
>;

export function getSubAccountSpotTransferMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SubAccountSpotTransferData, SubAccountSpotTransferParams> {
	return {
		mutationKey: createMutationKey("subAccountSpotTransfer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.subAccountSpotTransfer(params)),
	};
}

export function useExchangeSubAccountSpotTransfer(
	options: UseExchangeSubAccountSpotTransferOptions = {},
): UseExchangeSubAccountSpotTransferReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountSpotTransferMutationOptions(trading)));
}
