import type { WebData2WsEvent, WebData2WsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type WebData2Event = WebData2WsEvent;
type WebData2Params = WebData2WsParameters;

export type UseSubWebData2Parameters = WebData2Params;
export type UseSubWebData2Options = SubscriptionOptions<WebData2Event>;
export type UseSubWebData2ReturnType = SubscriptionResult<WebData2Event>;

export function useSubWebData2(
	params: UseSubWebData2Parameters,
	options: UseSubWebData2Options = {},
): UseSubWebData2ReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("webData2", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: WebData2Event) => void) => subscription.webData2(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
