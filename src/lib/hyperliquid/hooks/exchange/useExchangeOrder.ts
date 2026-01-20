import type { ExchangeClient, OrderParameters, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import type { BuilderConfig } from "../agent/types";
import { useHyperliquidClients } from "../useClients";

type OrderData = OrderSuccessResponse;
type OrderParams = OrderParameters;

export type UseExchangeOrderOptions = MutationParameter<OrderData, OrderParams>;
export type UseExchangeOrderReturnType = UseMutationResult<OrderData, HyperliquidQueryError, OrderParams>;

export function getOrderMutationOptions(
	exchange: ExchangeClient | null,
	builderConfig: BuilderConfig,
	clientKey?: string,
): MutationOptions<OrderData, OrderParams> {
	return {
		mutationKey: createMutationKey("order", clientKey),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.order({ ...params, builder: builderConfig })),
	};
}

export function useExchangeOrder(options: UseExchangeOrderOptions = {}): UseExchangeOrderReturnType {
	const { exchange } = useHyperliquidClients();
	const { builderConfig, clientKey } = useHyperliquid();

	const mutationOptions = getOrderMutationOptions(exchange, builderConfig, clientKey);

	return useMutation(mergeMutationOptions(options, mutationOptions));
}
