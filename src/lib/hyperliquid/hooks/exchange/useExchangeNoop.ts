import type { ExchangeClient, NoopSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type NoopData = NoopSuccessResponse;

export type UseExchangeNoopOptions = MutationParameter<NoopData, void>;
export type UseExchangeNoopReturnType = UseMutationResult<NoopData, HyperliquidQueryError, void>;

export function getNoopMutationOptions(exchange: ExchangeClient | null): MutationOptions<NoopData, void> {
	return {
		mutationKey: createMutationKey("noop"),
		mutationFn: guardedMutationFn(exchange, (ex) => ex.noop()),
	};
}

export function useExchangeNoop(options: UseExchangeNoopOptions = {}): UseExchangeNoopReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getNoopMutationOptions(trading)));
}
