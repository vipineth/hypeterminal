import type { TwapStatesWsEvent, TwapStatesWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
