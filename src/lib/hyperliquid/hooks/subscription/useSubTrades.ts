import type { TradesWsEvent, TradesWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
