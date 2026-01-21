import type { ExplorerTxsWsEvent } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type ExplorerTxsEvent = ExplorerTxsWsEvent;

export type UseSubExplorerTxsOptions = SubscriptionOptions;
export type UseSubExplorerTxsReturnType = SubscriptionResult<ExplorerTxsEvent>;

export function useSubExplorerTxs(options: UseSubExplorerTxsOptions = {}): UseSubExplorerTxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("explorerTxs"));

	return useSub(key, (listener) => subscription.explorerTxs(listener), options);
}
