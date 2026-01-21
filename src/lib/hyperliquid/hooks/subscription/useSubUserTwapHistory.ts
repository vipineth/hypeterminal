import type { UserTwapHistoryWsEvent, UserTwapHistoryWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type UserTwapHistoryEvent = UserTwapHistoryWsEvent;
type UserTwapHistoryParams = UserTwapHistoryWsParameters;

export type UseSubUserTwapHistoryParameters = UserTwapHistoryParams;
export type UseSubUserTwapHistoryOptions = SubscriptionOptions;
export type UseSubUserTwapHistoryReturnType = SubscriptionResult<UserTwapHistoryEvent>;

export function useSubUserTwapHistory(
	params: UseSubUserTwapHistoryParameters,
	options: UseSubUserTwapHistoryOptions = {},
): UseSubUserTwapHistoryReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userTwapHistory", params));

	return useSub(key, (listener) => subscription.userTwapHistory(params, listener), options);
}
