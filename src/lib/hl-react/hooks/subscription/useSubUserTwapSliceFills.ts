import type { UserTwapSliceFillsWsEvent, UserTwapSliceFillsWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type UserTwapSliceFillsEvent = UserTwapSliceFillsWsEvent;
type UserTwapSliceFillsParams = UserTwapSliceFillsWsParameters;

export type UseSubUserTwapSliceFillsParameters = UserTwapSliceFillsParams;
export type UseSubUserTwapSliceFillsOptions = SubscriptionOptions<UserTwapSliceFillsEvent>;
export type UseSubUserTwapSliceFillsReturnType = SubscriptionResult<UserTwapSliceFillsEvent>;

export function useSubUserTwapSliceFills(
	params: UseSubUserTwapSliceFillsParameters,
	options: UseSubUserTwapSliceFillsOptions = {},
): UseSubUserTwapSliceFillsReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("userTwapSliceFills", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserTwapSliceFillsEvent) => void) => subscription.userTwapSliceFills(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
