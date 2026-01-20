import type {
	ExchangeClient,
	SubAccountSpotTransferParameters,
	SubAccountSpotTransferSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
