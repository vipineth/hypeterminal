import type { UserTwapSliceFillsWsEvent, UserTwapSliceFillsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
