import type {
	ExchangeClient,
	SubAccountSpotTransferParameters,
	SubAccountSpotTransferSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.subAccountSpotTransfer(params);
		},
	};
}

export function useExchangeSubAccountSpotTransfer(
	options: UseExchangeSubAccountSpotTransferOptions = {},
): UseExchangeSubAccountSpotTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountSpotTransferMutationOptions(exchange)));
}
