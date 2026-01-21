import type { UserHistoricalOrdersWsEvent, UserHistoricalOrdersWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type UserHistoricalOrdersEvent = UserHistoricalOrdersWsEvent;
type UserHistoricalOrdersParams = UserHistoricalOrdersWsParameters;

export type UseSubUserHistoricalOrdersParameters = UserHistoricalOrdersParams;
export type UseSubUserHistoricalOrdersOptions = SubscriptionOptions;
export type UseSubUserHistoricalOrdersReturnType = SubscriptionResult<UserHistoricalOrdersEvent>;

export function useSubUserHistoricalOrders(
	params: UseSubUserHistoricalOrdersParameters,
	options: UseSubUserHistoricalOrdersOptions = {},
): UseSubUserHistoricalOrdersReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userHistoricalOrders", params));

	return useSub(key, (listener) => subscription.userHistoricalOrders(params, listener), options);
}
