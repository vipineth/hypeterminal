import type { ActiveAssetCtxWsEvent, ActiveAssetCtxWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type ActiveAssetCtxEvent = ActiveAssetCtxWsEvent;
type ActiveAssetCtxParams = ActiveAssetCtxWsParameters;

export type UseSubActiveAssetCtxParameters = ActiveAssetCtxParams;
export type UseSubActiveAssetCtxOptions = SubscriptionOptions<ActiveAssetCtxEvent>;
export type UseSubActiveAssetCtxReturnType = SubscriptionResult<ActiveAssetCtxEvent>;

export function useSubActiveAssetCtx(
	params: UseSubActiveAssetCtxParameters,
	options: UseSubActiveAssetCtxOptions = {},
): UseSubActiveAssetCtxReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("activeAssetCtx", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: ActiveAssetCtxEvent) => void) => subscription.activeAssetCtx(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
