import type { BatchModifyParameters, BatchModifySuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type BatchModifyData = BatchModifySuccessResponse;
type BatchModifyParams = BatchModifyParameters;

export type UseExchangeBatchModifyOptions = MutationParameter<BatchModifyData, BatchModifyParams>;
export type UseExchangeBatchModifyReturnType = UseMutationResult<
	BatchModifyData,
	HyperliquidQueryError,
	BatchModifyParams
>;

export function getBatchModifyMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<BatchModifyData, BatchModifyParams> {
	return {
		mutationKey: createMutationKey("batchModify"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.batchModify(params)),
	};
}

export function useExchangeBatchModify(options: UseExchangeBatchModifyOptions = {}): UseExchangeBatchModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getBatchModifyMutationOptions(exchange)));
}
