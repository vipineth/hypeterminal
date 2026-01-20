import type {
	ExchangeClient,
	SubAccountTransferParameters,
	SubAccountTransferSuccessResponse,
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

type SubAccountTransferData = SubAccountTransferSuccessResponse;
type SubAccountTransferParams = SubAccountTransferParameters;

export type UseExchangeSubAccountTransferOptions = MutationParameter<SubAccountTransferData, SubAccountTransferParams>;
export type UseExchangeSubAccountTransferReturnType = UseMutationResult<
	SubAccountTransferData,
	HyperliquidQueryError,
	SubAccountTransferParams
>;

export function getSubAccountTransferMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SubAccountTransferData, SubAccountTransferParams> {
	return {
		mutationKey: createMutationKey("subAccountTransfer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.subAccountTransfer(params)),
	};
}

export function useExchangeSubAccountTransfer(
	options: UseExchangeSubAccountTransferOptions = {},
): UseExchangeSubAccountTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountTransferMutationOptions(exchange)));
}
