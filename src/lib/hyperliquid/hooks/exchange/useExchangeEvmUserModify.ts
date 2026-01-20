import type { EvmUserModifyParameters, EvmUserModifySuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type EvmUserModifyData = EvmUserModifySuccessResponse;
type EvmUserModifyParams = EvmUserModifyParameters;

export type UseExchangeEvmUserModifyOptions = MutationParameter<EvmUserModifyData, EvmUserModifyParams>;
export type UseExchangeEvmUserModifyReturnType = UseMutationResult<
	EvmUserModifyData,
	HyperliquidQueryError,
	EvmUserModifyParams
>;

export function getEvmUserModifyMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<EvmUserModifyData, EvmUserModifyParams> {
	return {
		mutationKey: createMutationKey("evmUserModify"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.evmUserModify(params);
		},
	};
}

export function useExchangeEvmUserModify(
	options: UseExchangeEvmUserModifyOptions = {},
): UseExchangeEvmUserModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getEvmUserModifyMutationOptions(exchange)));
}
