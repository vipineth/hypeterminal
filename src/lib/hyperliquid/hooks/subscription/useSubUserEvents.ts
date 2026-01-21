import type { UserEventsWsEvent, UserEventsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type UserEventsEvent = UserEventsWsEvent;
type UserEventsParams = UserEventsWsParameters;

export type UseSubUserEventsParameters = UserEventsParams;
export type UseSubUserEventsOptions = SubscriptionOptions;
export type UseSubUserEventsReturnType = SubscriptionResult<UserEventsEvent>;

export function useSubUserEvents(
	params: UseSubUserEventsParameters,
	options: UseSubUserEventsOptions = {},
): UseSubUserEventsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userEvents", params));

	return useSub(key, (listener) => subscription.userEvents(params, listener), options);
}
