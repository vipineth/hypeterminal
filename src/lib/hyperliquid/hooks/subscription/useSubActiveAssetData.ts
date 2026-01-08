import type { ActiveAssetDataWsEvent, ActiveAssetDataWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type ActiveAssetDataEvent = ActiveAssetDataWsEvent;
type ActiveAssetDataParams = ActiveAssetDataWsParameters;

export type UseSubActiveAssetDataParameters = ActiveAssetDataParams;
export type UseSubActiveAssetDataOptions = SubscriptionOptions<ActiveAssetDataEvent>;
export type UseSubActiveAssetDataReturnType = SubscriptionResult<ActiveAssetDataEvent>;

export function useSubActiveAssetData(
	params: UseSubActiveAssetDataParameters,
	options: UseSubActiveAssetDataOptions = {},
): UseSubActiveAssetDataReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("activeAssetData", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: ActiveAssetDataEvent) => void) => subscription.activeAssetData(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
