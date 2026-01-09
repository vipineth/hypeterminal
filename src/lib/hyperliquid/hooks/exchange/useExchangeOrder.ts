import type { OrderParameters, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type OrderData = OrderSuccessResponse;
type OrderParams = OrderParameters;

export type UseExchangeOrderOptions = MutationParameter<OrderData, OrderParams>;
export type UseExchangeOrderReturnType = UseMutationResult<OrderData, HyperliquidQueryError, OrderParams>;

export function useExchangeOrder(options: UseExchangeOrderOptions = {}): UseExchangeOrderReturnType {
	const { exchange } = useHyperliquidClients();
	const { builderConfig, clientKey } = useHyperliquid();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("order", clientKey),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.order({ ...params, builder: builderConfig });
		},
	});
}
