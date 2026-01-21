import type { EvmUserModifyParameters, EvmUserModifySuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.evmUserModify(params)),
	};
}

export function useExchangeEvmUserModify(
	options: UseExchangeEvmUserModifyOptions = {},
): UseExchangeEvmUserModifyReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getEvmUserModifyMutationOptions(trading)));
}
