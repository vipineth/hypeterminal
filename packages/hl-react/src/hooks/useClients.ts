import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useConnection, useWalletClient } from "wagmi";
import { createExchangeClient } from "../clients";
import { useHyperliquid } from "../provider";
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
	const { info, subscription, isTestnet } = useHyperliquid();
	const { signer, isReady: agentReady } = useAgentWallet();
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

	const trading = (() => {
		if (!signer || !agentReady) return null;
		return createExchangeClient(signer, isTestnet);
	})();

	const user = (() => {
		if (!walletClient || !address) return null;
		const wallet = toHyperliquidWallet(walletClient, address);
		if (!wallet) return null;
		return createExchangeClient(wallet, isTestnet);
	})();

	return {
		info,
		subscription,
		trading,
		user,
	};
}
