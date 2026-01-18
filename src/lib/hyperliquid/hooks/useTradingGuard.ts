import { useCallback, useEffect, useRef, useState } from "react";
import { useTradingAgent } from "./useTradingAgent";

type PendingAction = () => void | Promise<void>;

interface UseTradingGuardResult {
	isReady: boolean;
	isEnabling: boolean;
	needsTrading: boolean;
	enableTrading: () => void;
	guardAction: (action: PendingAction) => void;
	error: Error | null;
	clearError: () => void;
}

export function useTradingGuard(): UseTradingGuardResult {
	const { status, registerStatus, registerAgent, error: agentError } = useTradingAgent();
	const pendingActionRef = useRef<PendingAction | null>(null);
	const prevStatusRef = useRef(status);
	const [localError, setLocalError] = useState<Error | null>(null);

	const isReady = status === "valid";
	const isEnabling = registerStatus === "signing" || registerStatus === "verifying";
	const needsTrading = status !== "valid" && status !== "loading";

	useEffect(() => {
		if (prevStatusRef.current !== "valid" && status === "valid" && pendingActionRef.current) {
			const action = pendingActionRef.current;
			pendingActionRef.current = null;
			Promise.resolve(action()).catch(() => {});
		}
		prevStatusRef.current = status;
	}, [status]);

	const enableTrading = useCallback(() => {
		if (isEnabling) return;
		setLocalError(null);
		registerAgent().catch((err) => {
			const error = err instanceof Error ? err : new Error(String(err));
			setLocalError(error);
		});
	}, [isEnabling, registerAgent]);

	const guardAction = useCallback(
		(action: PendingAction) => {
			if (isReady) {
				Promise.resolve(action()).catch(() => {});
				return;
			}
			pendingActionRef.current = action;
			enableTrading();
		},
		[isReady, enableTrading],
	);

	const clearError = useCallback(() => {
		setLocalError(null);
	}, []);

	return {
		isReady,
		isEnabling,
		needsTrading,
		enableTrading,
		guardAction,
		error: localError ?? agentError,
		clearError,
	};
}
