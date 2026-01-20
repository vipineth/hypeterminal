import type { BatchModifyParameters, BatchModifySuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface BatchModifyMutationContext {
	exchange: ExchangeClient | null;
}

export function getBatchModifyMutationOptions(
	context: BatchModifyMutationContext,
): MutationOptions<BatchModifyData, BatchModifyParams> {
	return {
		mutationKey: createMutationKey("batchModify"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.batchModify(params);
		},
	};
}

export function useExchangeBatchModify(options: UseExchangeBatchModifyOptions = {}): UseExchangeBatchModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getBatchModifyMutationOptions({ exchange })));
}
