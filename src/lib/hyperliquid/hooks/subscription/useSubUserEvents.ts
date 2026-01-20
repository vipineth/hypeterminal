import type { UserEventsWsEvent, UserEventsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
