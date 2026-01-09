import type { ExchangeClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useSigningMode } from "@/stores/use-trade-settings-store";
import { useHyperliquid } from "../context";
import { createExchangeClient } from "../clients";
import { useAgentRegistration } from "./useAgentRegistration";

export interface UseSignedExchangeResult {
	exchange: ExchangeClient | null;
	signerType: "direct" | "agent" | null;
	isReady: boolean;
}

export function useSignedExchange(): UseSignedExchangeResult {
	const { exchangeClient: directExchange } = useHyperliquid();
	const signingMode = useSigningMode();
	const { signer } = useAgentRegistration();

	const agentExchange = useMemo(() => {
		if (signingMode !== "agent" || !signer) return null;
		return createExchangeClient(signer);
	}, [signingMode, signer]);

	const exchange = signingMode === "direct" ? directExchange : agentExchange;
	const signerType = signingMode === "direct" && directExchange ? "direct" : agentExchange ? "agent" : null;

	return { exchange, signerType, isReady: exchange !== null };
}
