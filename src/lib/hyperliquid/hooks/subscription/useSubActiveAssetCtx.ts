import type { ActiveAssetCtxWsEvent, ActiveAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ActiveAssetCtxEvent = ActiveAssetCtxWsEvent;
type ActiveAssetCtxParams = ActiveAssetCtxWsParameters;

export type UseSubActiveAssetCtxParameters = ActiveAssetCtxParams;
export type UseSubActiveAssetCtxOptions = SubscriptionOptions;
export type UseSubActiveAssetCtxReturnType = SubscriptionResult<ActiveAssetCtxEvent>;

export function useSubActiveAssetCtx(
	params: UseSubActiveAssetCtxParameters,
	options: UseSubActiveAssetCtxOptions = {},
): UseSubActiveAssetCtxReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("activeAssetCtx", params));

	return useSub(key, (listener) => subscription.activeAssetCtx(params, listener), options);
}
