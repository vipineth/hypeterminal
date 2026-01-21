import type { ActiveSpotAssetCtxWsEvent, ActiveSpotAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type ActiveSpotAssetCtxEvent = ActiveSpotAssetCtxWsEvent;
type ActiveSpotAssetCtxParams = ActiveSpotAssetCtxWsParameters;

export type UseSubActiveSpotAssetCtxParameters = ActiveSpotAssetCtxParams;
export type UseSubActiveSpotAssetCtxOptions = SubscriptionOptions;
export type UseSubActiveSpotAssetCtxReturnType = SubscriptionResult<ActiveSpotAssetCtxEvent>;

export function useSubActiveSpotAssetCtx(
	params: UseSubActiveSpotAssetCtxParameters,
	options: UseSubActiveSpotAssetCtxOptions = {},
): UseSubActiveSpotAssetCtxReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("activeSpotAssetCtx", params));

	return useSub(key, (listener) => subscription.activeSpotAssetCtx(params, listener), options);
}
