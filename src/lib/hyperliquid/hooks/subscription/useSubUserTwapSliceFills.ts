import type { UserTwapSliceFillsWsEvent, UserTwapSliceFillsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type UserTwapSliceFillsEvent = UserTwapSliceFillsWsEvent;
type UserTwapSliceFillsParams = UserTwapSliceFillsWsParameters;

export type UseSubUserTwapSliceFillsParameters = UserTwapSliceFillsParams;
export type UseSubUserTwapSliceFillsOptions = SubscriptionOptions;
export type UseSubUserTwapSliceFillsReturnType = SubscriptionResult<UserTwapSliceFillsEvent>;

export function useSubUserTwapSliceFills(
	params: UseSubUserTwapSliceFillsParameters,
	options: UseSubUserTwapSliceFillsOptions = {},
): UseSubUserTwapSliceFillsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userTwapSliceFills", params));

	return useSub(key, (listener) => subscription.userTwapSliceFills(params, listener), options);
}
