import type { AssetCtxsWsEvent, AssetCtxsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type AssetCtxsEvent = AssetCtxsWsEvent;
type AssetCtxsParams = AssetCtxsWsParameters;

export type UseSubAssetCtxsParameters = AssetCtxsParams;
export type UseSubAssetCtxsOptions = SubscriptionOptions;
export type UseSubAssetCtxsReturnType = SubscriptionResult<AssetCtxsEvent>;

export function useSubAssetCtxs(
	params: UseSubAssetCtxsParameters,
	options: UseSubAssetCtxsOptions = {},
): UseSubAssetCtxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("assetCtxs", params));

	return useSub(key, (listener) => subscription.assetCtxs(params, listener), options);
}
