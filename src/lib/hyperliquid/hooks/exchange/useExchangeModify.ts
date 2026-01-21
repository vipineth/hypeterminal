import type { ExchangeClient, ModifyParameters, ModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type ModifyData = ModifySuccessResponse;
type ModifyParams = ModifyParameters;

export type UseExchangeModifyOptions = MutationParameter<ModifyData, ModifyParams>;
export type UseExchangeModifyReturnType = UseMutationResult<ModifyData, HyperliquidQueryError, ModifyParams>;

export function getModifyMutationOptions(exchange: ExchangeClient | null): MutationOptions<ModifyData, ModifyParams> {
	return {
		mutationKey: createMutationKey("modify"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.modify(params)),
	};
}

export function useExchangeModify(options: UseExchangeModifyOptions = {}): UseExchangeModifyReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getModifyMutationOptions(trading)));
}
