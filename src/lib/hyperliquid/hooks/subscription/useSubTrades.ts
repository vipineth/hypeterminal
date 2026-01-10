import type { TradesWsEvent, TradesWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type TradesEvent = TradesWsEvent;
type TradesParams = TradesWsParameters;

export type UseSubTradesParameters = TradesParams;
export type UseSubTradesOptions = SubscriptionOptions<TradesEvent>;
export type UseSubTradesReturnType = SubscriptionResult<TradesEvent>;

export function useSubTrades(
	params: UseSubTradesParameters,
	options: UseSubTradesOptions = {},
): UseSubTradesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("trades", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: TradesEvent) => void) => subscription.trades(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
