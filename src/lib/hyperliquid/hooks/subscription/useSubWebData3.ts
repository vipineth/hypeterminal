import type { WebData3WsEvent, WebData3WsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type WebData3Event = WebData3WsEvent;
type WebData3Params = WebData3WsParameters;

export type UseSubWebData3Parameters = WebData3Params;
export type UseSubWebData3Options = SubscriptionOptions;
export type UseSubWebData3ReturnType = SubscriptionResult<WebData3Event>;

export function useSubWebData3(
	params: UseSubWebData3Parameters,
	options: UseSubWebData3Options = {},
): UseSubWebData3ReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("webData3", params));

	return useSub(key, (listener) => subscription.webData3(params, listener), options);
}
