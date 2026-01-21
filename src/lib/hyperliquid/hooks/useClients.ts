import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { createExchangeClient } from "../clients";
import { useHyperliquid } from "../context";
import { useAgentWallet } from "../signing/use-agent-wallet";
import { useUserWallet } from "../use-user-wallet";
import { toHyperliquidWallet } from "../wallet";

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
	const { signer, isReady: agentReady } = useAgentWallet();
	const { address, walletClient } = useUserWallet();

	const trading = useMemo(() => {
		if (!signer || !agentReady) return null;
		return createExchangeClient(signer);
	}, [signer, agentReady]);

	const admin = useMemo(() => {
		if (!walletClient || !address) return null;
		const wallet = toHyperliquidWallet(walletClient, address);
		if (!wallet) return null;
		return createExchangeClient(wallet);
	}, [walletClient, address]);

	return {
		info,
		subscription,
		trading,
		admin,
		exchange: trading,
	};
}
