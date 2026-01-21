import type { OpenOrdersWsEvent, OpenOrdersWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type OpenOrdersEvent = OpenOrdersWsEvent;
type OpenOrdersParams = OpenOrdersWsParameters;

export type UseSubOpenOrdersParameters = OpenOrdersParams;
export type UseSubOpenOrdersOptions = SubscriptionOptions;
export type UseSubOpenOrdersReturnType = SubscriptionResult<OpenOrdersEvent>;

export function useSubOpenOrders(
	params: UseSubOpenOrdersParameters,
	options: UseSubOpenOrdersOptions = {},
): UseSubOpenOrdersReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("openOrders", params));

	return useSub(key, (listener) => subscription.openOrders(params, listener), options);
}
