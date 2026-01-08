import type { AllDexsClearinghouseStateWsEvent, AllDexsClearinghouseStateWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type AllDexsClearinghouseStateEvent = AllDexsClearinghouseStateWsEvent;
type AllDexsClearinghouseStateParams = AllDexsClearinghouseStateWsParameters;

export type UseSubAllDexsClearinghouseStateParameters = AllDexsClearinghouseStateParams;
export type UseSubAllDexsClearinghouseStateOptions = SubscriptionOptions<AllDexsClearinghouseStateEvent>;
export type UseSubAllDexsClearinghouseStateReturnType = SubscriptionResult<AllDexsClearinghouseStateEvent>;

export function useSubAllDexsClearinghouseState(
	params: UseSubAllDexsClearinghouseStateParameters,
	options: UseSubAllDexsClearinghouseStateOptions = {},
): UseSubAllDexsClearinghouseStateReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("allDexsClearinghouseState", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: AllDexsClearinghouseStateEvent) => void) =>
			subscription.allDexsClearinghouseState(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
