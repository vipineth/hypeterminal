import { useAgentRegistration, type UseAgentRegistrationResult } from "./useAgentRegistration";

export type UseTradingAgentResult = UseAgentRegistrationResult & {
	registerAgent: () => Promise<`0x${string}`>;
	resetAgent: () => void;
};

export function useTradingAgent(): UseTradingAgentResult {
	const result = useAgentRegistration();
	return {
		...result,
		registerAgent: result.register,
		resetAgent: result.reset,
	};
}
