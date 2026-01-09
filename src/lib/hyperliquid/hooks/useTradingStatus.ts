import { useConnection } from "wagmi";
import { useSigningMode } from "@/stores/use-trade-settings-store";
import type { TradingStatus } from "./agent/types";
import { useSignedExchange } from "./useSignedExchange";

export interface UseTradingStatusResult {
	status: TradingStatus;
	isReady: boolean;
}

export function useTradingStatus(): UseTradingStatusResult {
	const { address } = useConnection();
	const signingMode = useSigningMode();
	const { exchange, signerType } = useSignedExchange();

	const status: TradingStatus = !address
		? "no_wallet"
		: signingMode === "agent" && !signerType
			? "needs_approval"
			: !exchange
				? "no_signer"
				: "ready";

	return { status, isReady: status === "ready" };
}
