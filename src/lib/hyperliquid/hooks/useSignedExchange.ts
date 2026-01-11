import type { ExchangeClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { createExchangeClient } from "../clients";
import { useAgentRegistration } from "./useAgentRegistration";

export interface UseSignedExchangeResult {
	exchange: ExchangeClient | null;
	isReady: boolean;
}

export function useSignedExchange(): UseSignedExchangeResult {
	const { signer } = useAgentRegistration();

	const exchange = useMemo(() => {
		if (!signer) return null;
		return createExchangeClient(signer);
	}, [signer]);

	return { exchange, isReady: exchange !== null };
}
