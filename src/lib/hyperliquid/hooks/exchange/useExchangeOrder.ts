import type { ExchangeClient, OrderParameters, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { BuilderConfig } from "@/lib/hyperliquid/signing/types";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
	const { trading } = useHyperliquidClients();
	const { builderConfig, clientKey } = useHyperliquid();

	const mutationOptions = getOrderMutationOptions(trading, builderConfig, clientKey);

	return useMutation(mergeMutationOptions(options, mutationOptions));
}
