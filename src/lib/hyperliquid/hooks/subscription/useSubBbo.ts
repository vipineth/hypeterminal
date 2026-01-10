import type { BboWsEvent, BboWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type BboEvent = BboWsEvent;
type BboParams = BboWsParameters;

export type UseSubBboParameters = BboParams;
export type UseSubBboOptions = SubscriptionOptions<BboEvent>;
export type UseSubBboReturnType = SubscriptionResult<BboEvent>;

export function useSubBbo(params: UseSubBboParameters, options: UseSubBboOptions = {}): UseSubBboReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("bbo", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: BboEvent) => void) => subscription.bbo(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
