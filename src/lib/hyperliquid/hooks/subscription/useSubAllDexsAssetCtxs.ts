import type { AllDexsAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

export type { AllDexsAssetCtxsWsEvent };
export type AllDexsAssetCtxs = AllDexsAssetCtxsWsEvent["ctxs"];
export type DexAssetCtxs = AllDexsAssetCtxs[number];
export type DexAssetCtx = DexAssetCtxs[1][number];

export type UseSubAllDexsAssetCtxsOptions = SubscriptionOptions;
export type UseSubAllDexsAssetCtxsReturnType = SubscriptionResult<AllDexsAssetCtxsWsEvent>;

export function useSubAllDexsAssetCtxs(options: UseSubAllDexsAssetCtxsOptions = {}): UseSubAllDexsAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("allDexsAssetCtxs"));

	return useSub(key, (listener) => subscription.allDexsAssetCtxs(listener), options);
}
