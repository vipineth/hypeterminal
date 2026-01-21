import type { ActiveAssetCtxWsEvent, ActiveAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
