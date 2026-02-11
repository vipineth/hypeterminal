import type { UserFillsWsEvent, UserFillsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserFillsEvent = UserFillsWsEvent;
type UserFillsParams = UserFillsWsParameters;

export type UseSubUserFillsParameters = UserFillsParams;
export type UseSubUserFillsOptions = SubscriptionOptions;
export type UseSubUserFillsReturnType = SubscriptionResult<UserFillsEvent>;

const MAX_FILLS = 200;

export function useSubUserFills(
	params: UseSubUserFillsParameters,
	options: UseSubUserFillsOptions = {},
): UseSubUserFillsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFills", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userFills(params, listener),
		{
			getItems: (event) => event.fills,
			withItems: (event, items) => ({ ...event, fills: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_FILLS,
				getKey: (fill) => String(fill.tid),
				compare: (a, b) => b.time - a.time,
			},
		},
		options,
	);
}
