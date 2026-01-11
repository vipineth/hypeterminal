import type { ClearinghouseStateWsEvent, ClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ClearinghouseStateEvent = ClearinghouseStateWsEvent;
type ClearinghouseStateParams = ClearinghouseStateWsParameters;

export type UseSubClearinghouseStateParameters = ClearinghouseStateParams;
export type UseSubClearinghouseStateOptions = SubscriptionOptions<ClearinghouseStateEvent>;
export type UseSubClearinghouseStateReturnType = SubscriptionResult<ClearinghouseStateEvent>;

export function useSubClearinghouseState(
	params: UseSubClearinghouseStateParameters,
	options: UseSubClearinghouseStateOptions = {},
): UseSubClearinghouseStateReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("clearinghouseState", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: ClearinghouseStateEvent) => void) => subscription.clearinghouseState(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
