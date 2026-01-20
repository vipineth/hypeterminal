import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useAdminClient } from "../admin/use-admin-client";
import { useHyperliquid } from "../context";
import { useTradingClient } from "../trading/use-trading-client";

export interface HyperliquidClients {
	info: InfoClient;
	subscription: SubscriptionClient;
	trading: ExchangeClient | null;
	admin: ExchangeClient | null;
	/** @deprecated Use `trading` for L1 actions or `admin` for User-Signed actions */
	exchange: ExchangeClient | null;
}

export function useHyperliquidClients(): HyperliquidClients {
	const { info, subscription } = useHyperliquid();
	const { client: trading } = useTradingClient();
	const { client: admin } = useAdminClient();
	return {
		info,
		subscription,
		trading,
		admin,
		exchange: trading,
	};
}
