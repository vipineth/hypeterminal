import type { UserHistoricalOrdersWsEvent, UserHistoricalOrdersWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
