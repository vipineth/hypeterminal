import type { SpotAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useCallback } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type SpotAssetCtxsEvent = SpotAssetCtxsWsEvent;

export type UseSubSpotAssetCtxsOptions = SubscriptionOptions<SpotAssetCtxsEvent>;
export type UseSubSpotAssetCtxsReturnType = SubscriptionResult<SpotAssetCtxsEvent>;

export function useSubSpotAssetCtxs(options: UseSubSpotAssetCtxsOptions = {}): UseSubSpotAssetCtxsReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("spotAssetCtxs"));

	const subscribe = useCallback(
		(listener: (data: SpotAssetCtxsEvent) => void) => subscription.spotAssetCtxs(listener),
		[subscription],
	);

	return useSub(key, subscribe, options);
}
