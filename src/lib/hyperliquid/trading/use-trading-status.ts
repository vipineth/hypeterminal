import { useConnection } from "wagmi";
import { useAgentStatus } from "../signing/use-agent-status";

export type TradingStatus = "disconnected" | "needs_setup" | "ready";

export interface UseTradingStatusResult {
	status: TradingStatus;
	isReady: boolean;
	needsSetup: boolean;
}

export function useTradingStatus(): UseTradingStatusResult {
	const { address } = useConnection();
	const { isReady: agentReady } = useAgentStatus();

	const status: TradingStatus = !address
		? "disconnected"
		: agentReady
			? "ready"
			: "needs_setup";

	return {
		status,
		isReady: status === "ready",
		needsSetup: status === "needs_setup",
	};
}
