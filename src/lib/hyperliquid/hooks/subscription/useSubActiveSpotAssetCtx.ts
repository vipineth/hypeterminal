import type { ActiveSpotAssetCtxWsEvent, ActiveSpotAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
