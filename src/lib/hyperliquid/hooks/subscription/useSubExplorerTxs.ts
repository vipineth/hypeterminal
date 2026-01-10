import type { ExplorerTxsWsEvent } from "@nktkas/hyperliquid";
import { useCallback } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ExplorerTxsEvent = ExplorerTxsWsEvent;

export type UseSubExplorerTxsOptions = SubscriptionOptions<ExplorerTxsEvent>;
export type UseSubExplorerTxsReturnType = SubscriptionResult<ExplorerTxsEvent>;

export function useSubExplorerTxs(options: UseSubExplorerTxsOptions = {}): UseSubExplorerTxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("explorerTxs"));

	const subscribe = useCallback(
		(listener: (data: ExplorerTxsEvent) => void) => subscription.explorerTxs(listener),
		[subscription],
	);

	return useSub(key, subscribe, options);
}
