import type { ExchangeClient, NoopSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type NoopData = NoopSuccessResponse;

export type UseExchangeNoopOptions = MutationParameter<NoopData, void>;
export type UseExchangeNoopReturnType = UseMutationResult<NoopData, HyperliquidQueryError, void>;

interface NoopMutationContext {
	exchange: ExchangeClient | null;
}

export function getNoopMutationOptions(context: NoopMutationContext): MutationOptions<NoopData, void> {
	return {
		mutationKey: createMutationKey("noop"),
		mutationFn: () => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.noop();
		},
	};
}

export function useExchangeNoop(options: UseExchangeNoopOptions = {}): UseExchangeNoopReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getNoopMutationOptions({ exchange })));
}
