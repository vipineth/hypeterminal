import type { UserTwapHistoryWsEvent, UserTwapHistoryWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type UserTwapHistoryEvent = UserTwapHistoryWsEvent;
type UserTwapHistoryParams = UserTwapHistoryWsParameters;

export type UseSubUserTwapHistoryParameters = UserTwapHistoryParams;
export type UseSubUserTwapHistoryOptions = SubscriptionOptions<UserTwapHistoryEvent>;
export type UseSubUserTwapHistoryReturnType = SubscriptionResult<UserTwapHistoryEvent>;

export function useSubUserTwapHistory(
	params: UseSubUserTwapHistoryParameters,
	options: UseSubUserTwapHistoryOptions = {},
): UseSubUserTwapHistoryReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userTwapHistory", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserTwapHistoryEvent) => void) => subscription.userTwapHistory(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
