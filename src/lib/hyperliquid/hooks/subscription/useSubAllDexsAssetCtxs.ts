import type { AllDexsAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type AllDexsAssetCtxsEvent = AllDexsAssetCtxsWsEvent;

export type UseSubAllDexsAssetCtxsOptions = SubscriptionOptions;
export type UseSubAllDexsAssetCtxsReturnType = SubscriptionResult<AllDexsAssetCtxsEvent>;

export function useSubAllDexsAssetCtxs(options: UseSubAllDexsAssetCtxsOptions = {}): UseSubAllDexsAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("allDexsAssetCtxs"));

	return useSub(key, (listener) => subscription.allDexsAssetCtxs(listener), options);
}
