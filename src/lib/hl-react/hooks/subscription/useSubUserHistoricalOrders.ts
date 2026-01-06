import type { UserHistoricalOrdersWsEvent, UserHistoricalOrdersWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type UserHistoricalOrdersEvent = UserHistoricalOrdersWsEvent;
type UserHistoricalOrdersParams = UserHistoricalOrdersWsParameters;

export type UseSubUserHistoricalOrdersParameters = UserHistoricalOrdersParams;
export type UseSubUserHistoricalOrdersOptions = SubscriptionOptions<UserHistoricalOrdersEvent>;
export type UseSubUserHistoricalOrdersReturnType = SubscriptionResult<UserHistoricalOrdersEvent>;

export function useSubUserHistoricalOrders(
	params: UseSubUserHistoricalOrdersParameters,
	options: UseSubUserHistoricalOrdersOptions = {},
): UseSubUserHistoricalOrdersReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("userHistoricalOrders", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserHistoricalOrdersEvent) => void) => subscription.userHistoricalOrders(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
