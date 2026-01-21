import type { CandleWsEvent, CandleWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type CandleEvent = CandleWsEvent;
type CandleParams = CandleWsParameters;

export type UseSubCandleParameters = CandleParams;
export type UseSubCandleOptions = SubscriptionOptions;
export type UseSubCandleReturnType = SubscriptionResult<CandleEvent>;

export function useSubCandle(
	params: UseSubCandleParameters,
	options: UseSubCandleOptions = {},
): UseSubCandleReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("candle", params));

	return useSub(key, (listener) => subscription.candle(params, listener), options);
}
