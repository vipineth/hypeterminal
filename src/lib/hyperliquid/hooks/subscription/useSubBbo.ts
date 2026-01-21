import type { BboWsEvent, BboWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
