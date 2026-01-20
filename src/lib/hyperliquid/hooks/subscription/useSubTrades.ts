import type { TradesWsEvent, TradesWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type TradesEvent = TradesWsEvent;
type TradesParams = TradesWsParameters;

export type UseSubTradesParameters = TradesParams;
export type UseSubTradesOptions = SubscriptionOptions;
export type UseSubTradesReturnType = SubscriptionResult<TradesEvent>;

export function useSubTrades(
	params: UseSubTradesParameters,
	options: UseSubTradesOptions = {},
): UseSubTradesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("trades", params));

	return useSub(key, (listener) => subscription.trades(params, listener), options);
}
