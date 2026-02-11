import type { UserHistoricalOrdersWsEvent, UserHistoricalOrdersWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserHistoricalOrdersEvent = UserHistoricalOrdersWsEvent;
type UserHistoricalOrdersParams = UserHistoricalOrdersWsParameters;

export type UseSubUserHistoricalOrdersParameters = UserHistoricalOrdersParams;
export type UseSubUserHistoricalOrdersOptions = SubscriptionOptions;
export type UseSubUserHistoricalOrdersReturnType = SubscriptionResult<UserHistoricalOrdersEvent>;

const MAX_ORDERS = 500;

export function useSubUserHistoricalOrders(
	params: UseSubUserHistoricalOrdersParameters,
	options: UseSubUserHistoricalOrdersOptions = {},
): UseSubUserHistoricalOrdersReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userHistoricalOrders", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userHistoricalOrders(params, listener),
		{
			getItems: (event) => event.orderHistory,
			withItems: (event, items) => ({ ...event, orderHistory: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_ORDERS,
				getKey: (o) => String(o.order.oid),
				compare: (a, b) => b.statusTimestamp - a.statusTimestamp,
			},
		},
		options,
	);
}
