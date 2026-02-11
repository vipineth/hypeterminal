import type { TradesWsEvent, TradesWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { getTradeKey, type RawTrade } from "@/lib/trade/trades";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type TradesEvent = TradesWsEvent;
type TradesParams = TradesWsParameters;

export type UseSubTradesParameters = TradesParams;
export type UseSubTradesOptions = SubscriptionOptions;
export type UseSubTradesReturnType = SubscriptionResult<TradesEvent>;

const MAX_TRADES = 100;

export function useSubTrades(
	params: UseSubTradesParameters,
	options: UseSubTradesOptions = {},
): UseSubTradesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("trades", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.trades(params, listener),
		{
			getItems: (event) => event,
			withItems: (_, items) => items,
			isSnapshot: () => false,
			buffer: {
				maxSize: MAX_TRADES,
				getKey: (t: RawTrade) => getTradeKey(t.hash, t.tid),
				compare: (a: RawTrade, b: RawTrade) => b.time - a.time,
			},
		},
		options,
	);
}
