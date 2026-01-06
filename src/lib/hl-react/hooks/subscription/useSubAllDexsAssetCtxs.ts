import type { AllDexsAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useCallback } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type AllDexsAssetCtxsEvent = AllDexsAssetCtxsWsEvent;

export type UseSubAllDexsAssetCtxsOptions = SubscriptionOptions<AllDexsAssetCtxsEvent>;
export type UseSubAllDexsAssetCtxsReturnType = SubscriptionResult<AllDexsAssetCtxsEvent>;

export function useSubAllDexsAssetCtxs(options: UseSubAllDexsAssetCtxsOptions = {}): UseSubAllDexsAssetCtxsReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("allDexsAssetCtxs"));

	const subscribe = useCallback(
		(listener: (data: AllDexsAssetCtxsEvent) => void) => subscription.allDexsAssetCtxs(listener),
		[subscription],
	);

	return useSub(key, subscribe, options);
}
