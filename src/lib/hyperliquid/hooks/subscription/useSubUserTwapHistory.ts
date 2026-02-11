import type { UserTwapHistoryWsEvent, UserTwapHistoryWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserTwapHistoryEvent = UserTwapHistoryWsEvent;
type UserTwapHistoryParams = UserTwapHistoryWsParameters;

export type UseSubUserTwapHistoryParameters = UserTwapHistoryParams;
export type UseSubUserTwapHistoryOptions = SubscriptionOptions;
export type UseSubUserTwapHistoryReturnType = SubscriptionResult<UserTwapHistoryEvent>;

const MAX_TWAP_HISTORY = 200;

export function useSubUserTwapHistory(
	params: UseSubUserTwapHistoryParameters,
	options: UseSubUserTwapHistoryOptions = {},
): UseSubUserTwapHistoryReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userTwapHistory", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userTwapHistory(params, listener),
		{
			getItems: (event) => event.history,
			withItems: (event, items) => ({ ...event, history: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_TWAP_HISTORY,
				getKey: (h) => (h.twapId != null ? String(h.twapId) : `${h.time}-${h.state.coin}`),
				compare: (a, b) => b.time - a.time,
				shouldReplace: (existing, incoming) => incoming.time >= existing.time,
			},
		},
		options,
	);
}
