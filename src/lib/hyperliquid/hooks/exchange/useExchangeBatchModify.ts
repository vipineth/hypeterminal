import type { BatchModifyParameters, BatchModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeBatchModify(options: UseExchangeBatchModifyOptions = {}): UseExchangeBatchModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("batchModify"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.batchModify(params);
		},
	});
}
