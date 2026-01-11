import type { OrderUpdatesWsEvent, OrderUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type OrderUpdatesEvent = OrderUpdatesWsEvent;
type OrderUpdatesParams = OrderUpdatesWsParameters;

export type UseSubOrderUpdatesParameters = OrderUpdatesParams;
export type UseSubOrderUpdatesOptions = SubscriptionOptions<OrderUpdatesEvent>;
export type UseSubOrderUpdatesReturnType = SubscriptionResult<OrderUpdatesEvent>;

export function useSubOrderUpdates(
	params: UseSubOrderUpdatesParameters,
	options: UseSubOrderUpdatesOptions = {},
): UseSubOrderUpdatesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("orderUpdates", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: OrderUpdatesEvent) => void) => subscription.orderUpdates(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
