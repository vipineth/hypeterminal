import type { UserTwapSliceFillsWsEvent, UserTwapSliceFillsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserTwapSliceFillsEvent = UserTwapSliceFillsWsEvent;
type UserTwapSliceFillsParams = UserTwapSliceFillsWsParameters;

export type UseSubUserTwapSliceFillsParameters = UserTwapSliceFillsParams;
export type UseSubUserTwapSliceFillsOptions = SubscriptionOptions;
export type UseSubUserTwapSliceFillsReturnType = SubscriptionResult<UserTwapSliceFillsEvent>;

const MAX_TWAP_FILLS = 200;

export function useSubUserTwapSliceFills(
	params: UseSubUserTwapSliceFillsParameters,
	options: UseSubUserTwapSliceFillsOptions = {},
): UseSubUserTwapSliceFillsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userTwapSliceFills", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userTwapSliceFills(params, listener),
		{
			getItems: (event) => event.twapSliceFills,
			withItems: (event, items) => ({ ...event, twapSliceFills: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_TWAP_FILLS,
				getKey: (f) => String(f.fill.tid),
				compare: (a, b) => b.fill.time - a.fill.time,
			},
		},
		options,
	);
}
