import type { TwapStatesWsEvent, TwapStatesWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type TwapStatesEvent = TwapStatesWsEvent;
type TwapStatesParams = TwapStatesWsParameters;

export type UseSubTwapStatesParameters = TwapStatesParams;
export type UseSubTwapStatesOptions = SubscriptionOptions;
export type UseSubTwapStatesReturnType = SubscriptionResult<TwapStatesEvent>;

export function useSubTwapStates(
	params: UseSubTwapStatesParameters,
	options: UseSubTwapStatesOptions = {},
): UseSubTwapStatesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("twapStates", params));

	return useSub(key, (listener) => subscription.twapStates(params, listener), options);
}
