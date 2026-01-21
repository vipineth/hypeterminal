import type { OrderUpdatesWsEvent, OrderUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type OrderUpdatesEvent = OrderUpdatesWsEvent;
type OrderUpdatesParams = OrderUpdatesWsParameters;

export type UseSubOrderUpdatesParameters = OrderUpdatesParams;
export type UseSubOrderUpdatesOptions = SubscriptionOptions;
export type UseSubOrderUpdatesReturnType = SubscriptionResult<OrderUpdatesEvent>;

export function useSubOrderUpdates(
	params: UseSubOrderUpdatesParameters,
	options: UseSubOrderUpdatesOptions = {},
): UseSubOrderUpdatesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("orderUpdates", params));

	return useSub(key, (listener) => subscription.orderUpdates(params, listener), options);
}
