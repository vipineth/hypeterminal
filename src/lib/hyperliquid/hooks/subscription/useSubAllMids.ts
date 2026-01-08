import type { AllMidsWsEvent, AllMidsWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type AllMidsEvent = AllMidsWsEvent;
type AllMidsParams = AllMidsWsParameters;

export type UseSubAllMidsParameters = AllMidsParams;
export type UseSubAllMidsOptions = SubscriptionOptions<AllMidsEvent>;
export type UseSubAllMidsReturnType = SubscriptionResult<AllMidsEvent>;

export function useSubAllMids(
	params: UseSubAllMidsParameters,
	options: UseSubAllMidsOptions = {},
): UseSubAllMidsReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("allMids", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: AllMidsEvent) => void) => subscription.allMids(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
