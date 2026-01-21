import type { ClearinghouseStateWsEvent, ClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
