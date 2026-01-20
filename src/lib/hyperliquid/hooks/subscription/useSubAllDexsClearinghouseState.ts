import type { AllDexsClearinghouseStateWsEvent, AllDexsClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type AllDexsClearinghouseStateEvent = AllDexsClearinghouseStateWsEvent;
type AllDexsClearinghouseStateParams = AllDexsClearinghouseStateWsParameters;

export type UseSubAllDexsClearinghouseStateParameters = AllDexsClearinghouseStateParams;
export type UseSubAllDexsClearinghouseStateOptions = SubscriptionOptions;
export type UseSubAllDexsClearinghouseStateReturnType = SubscriptionResult<AllDexsClearinghouseStateEvent>;

export function useSubAllDexsClearinghouseState(
	params: UseSubAllDexsClearinghouseStateParameters,
	options: UseSubAllDexsClearinghouseStateOptions = {},
): UseSubAllDexsClearinghouseStateReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("allDexsClearinghouseState", params));

	return useSub(key, (listener) => subscription.allDexsClearinghouseState(params, listener), options);
}
