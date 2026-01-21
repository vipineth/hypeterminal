import type { AllMidsWsEvent, AllMidsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
