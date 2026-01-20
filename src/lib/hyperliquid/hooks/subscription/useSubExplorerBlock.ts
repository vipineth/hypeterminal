import type { ExplorerBlockWsEvent } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ExplorerBlockEvent = ExplorerBlockWsEvent;

export type UseSubExplorerBlockOptions = SubscriptionOptions;
export type UseSubExplorerBlockReturnType = SubscriptionResult<ExplorerBlockEvent>;

export function useSubExplorerBlock(options: UseSubExplorerBlockOptions = {}): UseSubExplorerBlockReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("explorerBlock"));

	return useSub(key, (listener) => subscription.explorerBlock(listener), options);
}
