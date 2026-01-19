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
	const mountedRef = useRef(true);
	const [localError, setLocalError] = useState<Error | null>(null);

	const isReady = status === "valid";
	const isEnabling = registerStatus === "signing" || registerStatus === "verifying";
	const needsTrading = status !== "valid" && status !== "loading";

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		const wasValid = prevStatusRef.current === "valid";
		const isNowValid = status === "valid";

		if (!wasValid && isNowValid && pendingActionRef.current && mountedRef.current) {
			const action = pendingActionRef.current;
			pendingActionRef.current = null;
			Promise.resolve(action()).catch(() => {});
		}

		if (wasValid && !isNowValid) {
			pendingActionRef.current = null;
		}

		prevStatusRef.current = status;
	}, [status]);

	const enableTrading = useCallback(() => {
		if (isEnabling) return;
		setLocalError(null);
		registerAgent().catch((err) => {
			pendingActionRef.current = null;
			if (!mountedRef.current) return;
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
