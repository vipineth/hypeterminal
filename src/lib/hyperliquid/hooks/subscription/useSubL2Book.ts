import type { L2BookWsEvent, L2BookWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type L2BookEvent = L2BookWsEvent;
type L2BookParams = L2BookWsParameters;

export type UseSubL2BookParameters = L2BookParams;
export type UseSubL2BookOptions = SubscriptionOptions;
export type UseSubL2BookReturnType = SubscriptionResult<L2BookEvent>;

const DEFAULT_THROTTLE_MS = 16;

export function useSubL2Book(
	params: UseSubL2BookParameters,
	options: UseSubL2BookOptions = {},
): UseSubL2BookReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("l2Book", params));
	const mergedOptions = { throttleMs: DEFAULT_THROTTLE_MS, ...options };

	return useSub(key, (listener) => subscription.l2Book(params, listener), mergedOptions);
}
