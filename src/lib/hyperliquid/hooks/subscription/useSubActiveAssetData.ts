import type { ActiveAssetDataWsEvent, ActiveAssetDataWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
