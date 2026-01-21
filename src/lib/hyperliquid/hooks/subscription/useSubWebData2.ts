import type { WebData2WsEvent, WebData2WsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type WebData2Event = WebData2WsEvent;
type WebData2Params = WebData2WsParameters;

export type UseSubWebData2Parameters = WebData2Params;
export type UseSubWebData2Options = SubscriptionOptions;
export type UseSubWebData2ReturnType = SubscriptionResult<WebData2Event>;

export function useSubWebData2(
	params: UseSubWebData2Parameters,
	options: UseSubWebData2Options = {},
): UseSubWebData2ReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("webData2", params));

	return useSub(key, (listener) => subscription.webData2(params, listener), options);
}
