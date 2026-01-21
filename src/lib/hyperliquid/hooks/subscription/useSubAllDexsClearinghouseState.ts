import type { AllDexsClearinghouseStateWsEvent, AllDexsClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
