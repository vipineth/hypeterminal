import type { UserFillsWsEvent, UserFillsWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquid } from "../../context";
import { useSub } from "../utils/useSub";

type UserFillsEvent = UserFillsWsEvent;
type UserFillsParams = UserFillsWsParameters;

export type UseSubUserFillsParameters = UserFillsParams;
export type UseSubUserFillsOptions = SubscriptionOptions<UserFillsEvent>;
export type UseSubUserFillsReturnType = SubscriptionResult<UserFillsEvent>;

export function useSubUserFills(
	params: UseSubUserFillsParameters,
	options: UseSubUserFillsOptions = {},
): UseSubUserFillsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFills", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserFillsEvent) => void) => subscription.userFills(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
