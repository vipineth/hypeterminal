import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { createExchangeClient } from "../clients";
import { useHyperliquid } from "../context";
import { useAgentWallet } from "../signing/use-agent-wallet";
import { toHyperliquidWallet } from "../wallet";

export interface HyperliquidClients {
	info: InfoClient;
	subscription: SubscriptionClient;
	/** Exchange client using agent wallet - for L1 trading actions (order, cancel, etc.) */
	trading: ExchangeClient | null;
	/** Exchange client using user wallet - for user-signed actions (approveAgent, approveBuilderFee, withdraw, etc.) */
	user: ExchangeClient | null;
}

export function useHyperliquidClients(): HyperliquidClients {
	const { info, subscription } = useHyperliquid();
	const { signer, isReady: agentReady } = useAgentWallet();
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

	const trading = useMemo(() => {
		if (!signer || !agentReady) return null;
		return createExchangeClient(signer);
	}, [signer, agentReady]);

	const user = useMemo(() => {
		if (!walletClient || !address) return null;
		const wallet = toHyperliquidWallet(walletClient, address);
		if (!wallet) return null;
		return createExchangeClient(wallet);
	}, [walletClient, address]);

	return {
		info,
		subscription,
		trading,
		user,
	};
}
