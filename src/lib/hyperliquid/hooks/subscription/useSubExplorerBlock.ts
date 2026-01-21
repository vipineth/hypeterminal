import type { ExplorerBlockWsEvent } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type ExplorerBlockEvent = ExplorerBlockWsEvent;

export type UseSubExplorerBlockOptions = SubscriptionOptions;
export type UseSubExplorerBlockReturnType = SubscriptionResult<ExplorerBlockEvent>;

export function useSubExplorerBlock(options: UseSubExplorerBlockOptions = {}): UseSubExplorerBlockReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("explorerBlock"));

	return useSub(key, (listener) => subscription.explorerBlock(listener), options);
}
