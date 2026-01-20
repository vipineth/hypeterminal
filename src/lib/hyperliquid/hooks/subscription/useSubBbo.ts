import type { BboWsEvent, BboWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type BboEvent = BboWsEvent;
type BboParams = BboWsParameters;

export type UseSubBboParameters = BboParams;
export type UseSubBboOptions = SubscriptionOptions;
export type UseSubBboReturnType = SubscriptionResult<BboEvent>;

export function useSubBbo(params: UseSubBboParameters, options: UseSubBboOptions = {}): UseSubBboReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("bbo", params));

	return useSub(key, (listener) => subscription.bbo(params, listener), options);
}
