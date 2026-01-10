import type { L2BookWsEvent, L2BookWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type L2BookEvent = L2BookWsEvent;
type L2BookParams = L2BookWsParameters;

export type UseSubL2BookParameters = L2BookParams;
export type UseSubL2BookOptions = SubscriptionOptions<L2BookEvent>;
export type UseSubL2BookReturnType = SubscriptionResult<L2BookEvent>;

export function useSubL2Book(
	params: UseSubL2BookParameters,
	options: UseSubL2BookOptions = {},
): UseSubL2BookReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("l2Book", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: L2BookEvent) => void) => subscription.l2Book(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
