import type { ExchangeClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { createExchangeClient } from "../clients";
import { useAgentWallet } from "../signing/use-agent-wallet";

export interface UseTradingClientResult {
	client: ExchangeClient | null;
	isReady: boolean;
}

export function useTradingClient(): UseTradingClientResult {
	const { signer, isReady } = useAgentWallet();

	const client = useMemo(() => {
		if (!signer) return null;
		return createExchangeClient(signer);
	}, [signer]);

	return {
		client,
		isReady: isReady && client !== null,
	};
}
