import type { AllMidsWsEvent, AllMidsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type AllMidsEvent = AllMidsWsEvent;
type AllMidsParams = AllMidsWsParameters;

export type UseSubAllMidsParameters = AllMidsParams;
export type UseSubAllMidsOptions = SubscriptionOptions;
export type UseSubAllMidsReturnType = SubscriptionResult<AllMidsEvent>;

export function useSubAllMids(
	params: UseSubAllMidsParameters,
	options: UseSubAllMidsOptions = {},
): UseSubAllMidsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("allMids", params));

	return useSub(key, (listener) => subscription.allMids(params, listener), options);
}
