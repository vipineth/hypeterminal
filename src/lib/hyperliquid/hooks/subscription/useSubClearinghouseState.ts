import type { ClearinghouseStateWsEvent, ClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ClearinghouseStateEvent = ClearinghouseStateWsEvent;
type ClearinghouseStateParams = ClearinghouseStateWsParameters;

export type UseSubClearinghouseStateParameters = ClearinghouseStateParams;
export type UseSubClearinghouseStateOptions = SubscriptionOptions;
export type UseSubClearinghouseStateReturnType = SubscriptionResult<ClearinghouseStateEvent>;

export function useSubClearinghouseState(
	params: UseSubClearinghouseStateParameters,
	options: UseSubClearinghouseStateOptions = {},
): UseSubClearinghouseStateReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("clearinghouseState", params));

	return useSub(key, (listener) => subscription.clearinghouseState(params, listener), options);
}
