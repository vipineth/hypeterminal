import type { SpotAssetCtxsWsEvent } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type SpotAssetCtxsEvent = SpotAssetCtxsWsEvent;

export type UseSubSpotAssetCtxsOptions = SubscriptionOptions;
export type UseSubSpotAssetCtxsReturnType = SubscriptionResult<SpotAssetCtxsEvent>;

export function useSubSpotAssetCtxs(options: UseSubSpotAssetCtxsOptions = {}): UseSubSpotAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("spotAssetCtxs"));

	return useSub(key, (listener) => subscription.spotAssetCtxs(listener), options);
}
