import type { ExchangeClient, ModifyParameters, ModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ModifyData = ModifySuccessResponse;
type ModifyParams = ModifyParameters;

export type UseExchangeModifyOptions = MutationParameter<ModifyData, ModifyParams>;
export type UseExchangeModifyReturnType = UseMutationResult<ModifyData, HyperliquidQueryError, ModifyParams>;

export function getModifyMutationOptions(exchange: ExchangeClient | null): MutationOptions<ModifyData, ModifyParams> {
	return {
		mutationKey: createMutationKey("modify"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.modify(params);
		},
	};
}

export function useExchangeModify(options: UseExchangeModifyOptions = {}): UseExchangeModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getModifyMutationOptions(exchange)));
}
