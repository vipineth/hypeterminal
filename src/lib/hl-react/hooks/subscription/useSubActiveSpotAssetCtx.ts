import type { ActiveSpotAssetCtxWsEvent, ActiveSpotAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type ActiveSpotAssetCtxEvent = ActiveSpotAssetCtxWsEvent;
type ActiveSpotAssetCtxParams = ActiveSpotAssetCtxWsParameters;

export type UseSubActiveSpotAssetCtxParameters = ActiveSpotAssetCtxParams;
export type UseSubActiveSpotAssetCtxOptions = SubscriptionOptions<ActiveSpotAssetCtxEvent>;
export type UseSubActiveSpotAssetCtxReturnType = SubscriptionResult<ActiveSpotAssetCtxEvent>;

export function useSubActiveSpotAssetCtx(
	params: UseSubActiveSpotAssetCtxParameters,
	options: UseSubActiveSpotAssetCtxOptions = {},
): UseSubActiveSpotAssetCtxReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("activeSpotAssetCtx", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: ActiveSpotAssetCtxEvent) => void) => subscription.activeSpotAssetCtx(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
