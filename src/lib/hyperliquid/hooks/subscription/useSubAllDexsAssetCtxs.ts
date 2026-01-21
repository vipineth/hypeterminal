import type { AllDexsAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type AllDexsAssetCtxsEvent = AllDexsAssetCtxsWsEvent;

export type UseSubAllDexsAssetCtxsOptions = SubscriptionOptions;
export type UseSubAllDexsAssetCtxsReturnType = SubscriptionResult<AllDexsAssetCtxsEvent>;

export function useSubAllDexsAssetCtxs(options: UseSubAllDexsAssetCtxsOptions = {}): UseSubAllDexsAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("allDexsAssetCtxs"));

	return useSub(key, (listener) => subscription.allDexsAssetCtxs(listener), options);
}
