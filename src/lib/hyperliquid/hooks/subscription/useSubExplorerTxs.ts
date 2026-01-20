import type { ExplorerTxsWsEvent } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type ExplorerTxsEvent = ExplorerTxsWsEvent;

export type UseSubExplorerTxsOptions = SubscriptionOptions;
export type UseSubExplorerTxsReturnType = SubscriptionResult<ExplorerTxsEvent>;

export function useSubExplorerTxs(options: UseSubExplorerTxsOptions = {}): UseSubExplorerTxsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("explorerTxs"));

	return useSub(key, (listener) => subscription.explorerTxs(listener), options);
}
