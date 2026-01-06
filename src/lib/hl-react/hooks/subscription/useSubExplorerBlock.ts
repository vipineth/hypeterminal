import type { ExplorerBlockWsEvent } from "@nktkas/hyperliquid";
import { useCallback } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type ExplorerBlockEvent = ExplorerBlockWsEvent;

export type UseSubExplorerBlockOptions = SubscriptionOptions<ExplorerBlockEvent>;
export type UseSubExplorerBlockReturnType = SubscriptionResult<ExplorerBlockEvent>;

export function useSubExplorerBlock(options: UseSubExplorerBlockOptions = {}): UseSubExplorerBlockReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("explorerBlock"));

	const subscribe = useCallback(
		(listener: (data: ExplorerBlockEvent) => void) => subscription.explorerBlock(listener),
		[subscription],
	);

	return useSub(key, subscribe, options);
}
