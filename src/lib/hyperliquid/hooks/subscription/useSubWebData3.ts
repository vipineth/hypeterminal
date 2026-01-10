import type { WebData3WsEvent, WebData3WsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type WebData3Event = WebData3WsEvent;
type WebData3Params = WebData3WsParameters;

export type UseSubWebData3Parameters = WebData3Params;
export type UseSubWebData3Options = SubscriptionOptions<WebData3Event>;
export type UseSubWebData3ReturnType = SubscriptionResult<WebData3Event>;

export function useSubWebData3(
	params: UseSubWebData3Parameters,
	options: UseSubWebData3Options = {},
): UseSubWebData3ReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("webData3", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: WebData3Event) => void) => subscription.webData3(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
