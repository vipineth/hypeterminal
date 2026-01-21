import type { SpotAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type SpotAssetCtxsEvent = SpotAssetCtxsWsEvent;

export type UseSubSpotAssetCtxsOptions = SubscriptionOptions;
export type UseSubSpotAssetCtxsReturnType = SubscriptionResult<SpotAssetCtxsEvent>;

export function useSubSpotAssetCtxs(options: UseSubSpotAssetCtxsOptions = {}): UseSubSpotAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("spotAssetCtxs"));

	return useSub(key, (listener) => subscription.spotAssetCtxs(listener), options);
}
