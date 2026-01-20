import type { EvmUserModifyParameters, EvmUserModifySuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
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

interface EvmUserModifyMutationContext {
	exchange: ExchangeClient | null;
}

export function getEvmUserModifyMutationOptions(
	context: EvmUserModifyMutationContext,
): MutationOptions<EvmUserModifyData, EvmUserModifyParams> {
	return {
		mutationKey: createMutationKey("evmUserModify"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.evmUserModify(params);
		},
	};
}

export function useExchangeEvmUserModify(
	options: UseExchangeEvmUserModifyOptions = {},
): UseExchangeEvmUserModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getEvmUserModifyMutationOptions({ exchange })));
}
