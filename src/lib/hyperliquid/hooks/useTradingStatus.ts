import { useConnection } from "wagmi";
import type { TradingStatus } from "./agent/types";
import { useSignedExchange } from "./useSignedExchange";

export interface UseTradingStatusResult {
	status: TradingStatus;
	isReady: boolean;
}

export function useTradingStatus(): UseTradingStatusResult {
	const { address } = useConnection();
	const { exchange } = useSignedExchange();

	const status: TradingStatus = !address ? "no_wallet" : !exchange ? "needs_approval" : "ready";

	return { status, isReady: status === "ready" };
}
