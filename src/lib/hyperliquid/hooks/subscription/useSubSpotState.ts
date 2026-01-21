import type { SpotStateWsEvent, SpotStateWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
