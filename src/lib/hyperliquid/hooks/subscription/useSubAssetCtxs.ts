import type { AssetCtxsWsEvent, AssetCtxsWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type AssetCtxsEvent = AssetCtxsWsEvent;
type AssetCtxsParams = AssetCtxsWsParameters;

export type UseSubAssetCtxsParameters = AssetCtxsParams;
export type UseSubAssetCtxsOptions = SubscriptionOptions<AssetCtxsEvent>;
export type UseSubAssetCtxsReturnType = SubscriptionResult<AssetCtxsEvent>;

export function useSubAssetCtxs(
	params: UseSubAssetCtxsParameters,
	options: UseSubAssetCtxsOptions = {},
): UseSubAssetCtxsReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("assetCtxs", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: AssetCtxsEvent) => void) => subscription.assetCtxs(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
