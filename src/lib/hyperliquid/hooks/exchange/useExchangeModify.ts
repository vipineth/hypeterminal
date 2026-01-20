import type { ExchangeClient, ModifyParameters, ModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ModifyData = ModifySuccessResponse;
type ModifyParams = ModifyParameters;

export type UseExchangeModifyOptions = MutationParameter<ModifyData, ModifyParams>;
export type UseExchangeModifyReturnType = UseMutationResult<ModifyData, HyperliquidQueryError, ModifyParams>;

interface ModifyMutationContext {
	exchange: ExchangeClient | null;
}

export function getModifyMutationOptions(context: ModifyMutationContext): MutationOptions<ModifyData, ModifyParams> {
	return {
		mutationKey: createMutationKey("modify"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.modify(params);
		},
	};
}

export function useExchangeModify(options: UseExchangeModifyOptions = {}): UseExchangeModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getModifyMutationOptions({ exchange })));
}
