import type { CancelByCloidParameters, CancelByCloidSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CancelByCloidData = CancelByCloidSuccessResponse;
type CancelByCloidParams = CancelByCloidParameters;

export type UseExchangeCancelByCloidOptions = MutationParameter<CancelByCloidData, CancelByCloidParams>;
export type UseExchangeCancelByCloidReturnType = UseMutationResult<
	CancelByCloidData,
	HyperliquidQueryError,
	CancelByCloidParams
>;

export function getCancelByCloidMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<CancelByCloidData, CancelByCloidParams> {
	return {
		mutationKey: createMutationKey("cancelByCloid"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.cancelByCloid(params);
		},
	};
}

export function useExchangeCancelByCloid(
	options: UseExchangeCancelByCloidOptions = {},
): UseExchangeCancelByCloidReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCancelByCloidMutationOptions(exchange)));
}
