import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../context";
import { useSignedExchange } from "./useSignedExchange";

export interface HyperliquidClients {
	info: InfoClient;
	subscription: SubscriptionClient;
	exchange: ExchangeClient | null;
}

export function useHyperliquidClients(): HyperliquidClients {
	const { info, subscription } = useHyperliquid();
	const { exchange } = useSignedExchange();
	return { info, subscription, exchange };
}
