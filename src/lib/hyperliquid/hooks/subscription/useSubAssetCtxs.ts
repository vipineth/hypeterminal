import type { AssetCtxsWsEvent, AssetCtxsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
