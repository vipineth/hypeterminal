import type { SpotStateWsEvent, SpotStateWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type SpotStateEvent = SpotStateWsEvent;
type SpotStateParams = SpotStateWsParameters;

export type UseSubSpotStateParameters = SpotStateParams;
export type UseSubSpotStateOptions = SubscriptionOptions;
export type UseSubSpotStateReturnType = SubscriptionResult<SpotStateEvent>;

export function useSubSpotState(
	params: UseSubSpotStateParameters,
	options: UseSubSpotStateOptions = {},
): UseSubSpotStateReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("spotState", params));

	return useSub(key, (listener) => subscription.spotState(params, listener), options);
}
