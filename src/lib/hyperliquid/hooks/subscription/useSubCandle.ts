import type { CandleWsEvent, CandleWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
