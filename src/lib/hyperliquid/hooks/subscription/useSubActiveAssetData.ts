import type { ActiveAssetDataWsEvent, ActiveAssetDataWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type ActiveAssetDataEvent = ActiveAssetDataWsEvent;
type ActiveAssetDataParams = ActiveAssetDataWsParameters;

export type UseSubActiveAssetDataParameters = ActiveAssetDataParams;
export type UseSubActiveAssetDataOptions = SubscriptionOptions;
export type UseSubActiveAssetDataReturnType = SubscriptionResult<ActiveAssetDataEvent>;

export function useSubActiveAssetData(
	params: UseSubActiveAssetDataParameters,
	options: UseSubActiveAssetDataOptions = {},
): UseSubActiveAssetDataReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("activeAssetData", params));

	return useSub(key, (listener) => subscription.activeAssetData(params, listener), options);
}
