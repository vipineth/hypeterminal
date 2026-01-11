import type { OpenOrdersWsEvent, OpenOrdersWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type OpenOrdersEvent = OpenOrdersWsEvent;
type OpenOrdersParams = OpenOrdersWsParameters;

export type UseSubOpenOrdersParameters = OpenOrdersParams;
export type UseSubOpenOrdersOptions = SubscriptionOptions<OpenOrdersEvent>;
export type UseSubOpenOrdersReturnType = SubscriptionResult<OpenOrdersEvent>;

export function useSubOpenOrders(
	params: UseSubOpenOrdersParameters,
	options: UseSubOpenOrdersOptions = {},
): UseSubOpenOrdersReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("openOrders", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: OpenOrdersEvent) => void) => subscription.openOrders(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
