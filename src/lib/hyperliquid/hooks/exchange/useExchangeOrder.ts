import type { ExchangeClient, OrderParameters, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import type { BuilderConfig } from "../agent/types";
import { useHyperliquidClients } from "../useClients";

type OrderData = OrderSuccessResponse;
type OrderParams = OrderParameters;

export type UseExchangeOrderOptions = MutationParameter<OrderData, OrderParams>;
export type UseExchangeOrderReturnType = UseMutationResult<OrderData, HyperliquidQueryError, OrderParams>;

interface OrderMutationContext {
	exchange: ExchangeClient | null;
	builderConfig: BuilderConfig;
}

export function getOrderMutationOptions(
	context: OrderMutationContext,
	clientKey?: string,
): MutationOptions<OrderData, OrderParams> {
	return {
		mutationKey: createMutationKey("order", clientKey),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.order({ ...params, builder: context.builderConfig });
		},
	};
}

export function useExchangeOrder(options: UseExchangeOrderOptions = {}): UseExchangeOrderReturnType {
	const { exchange } = useHyperliquidClients();
	const { builderConfig, clientKey } = useHyperliquid();

	const mutationOptions = getOrderMutationOptions({ exchange, builderConfig }, clientKey);

	return useMutation(mergeMutationOptions(options, mutationOptions));
}
