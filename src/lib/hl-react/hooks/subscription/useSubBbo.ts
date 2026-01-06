import type { BboWsEvent, BboWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type BboEvent = BboWsEvent;
type BboParams = BboWsParameters;

export type UseSubBboParameters = BboParams;
export type UseSubBboOptions = SubscriptionOptions<BboEvent>;
export type UseSubBboReturnType = SubscriptionResult<BboEvent>;

export function useSubBbo(params: UseSubBboParameters, options: UseSubBboOptions = {}): UseSubBboReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("bbo", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: BboEvent) => void) => subscription.bbo(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
