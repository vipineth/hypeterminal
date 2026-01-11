import type { SpotStateWsEvent, SpotStateWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type SpotStateEvent = SpotStateWsEvent;
type SpotStateParams = SpotStateWsParameters;

export type UseSubSpotStateParameters = SpotStateParams;
export type UseSubSpotStateOptions = SubscriptionOptions<SpotStateEvent>;
export type UseSubSpotStateReturnType = SubscriptionResult<SpotStateEvent>;

export function useSubSpotState(
	params: UseSubSpotStateParameters,
	options: UseSubSpotStateOptions = {},
): UseSubSpotStateReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("spotState", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: SpotStateEvent) => void) => subscription.spotState(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
