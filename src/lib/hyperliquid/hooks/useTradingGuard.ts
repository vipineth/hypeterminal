import { useCallback, useEffect, useRef } from "react";
import { useTradingAgent } from "./useTradingAgent";

type PendingAction = () => void | Promise<void>;

interface UseTradingGuardResult {
	isReady: boolean;
	isEnabling: boolean;
	needsTrading: boolean;
	enableTrading: () => void;
	guardAction: (action: PendingAction) => void;
	error: Error | null;
}

export function useTradingGuard(): UseTradingGuardResult {
	const { status, registerStatus, registerAgent, error } = useTradingAgent();
	const pendingActionRef = useRef<PendingAction | null>(null);
	const prevStatusRef = useRef(status);

	const isReady = status === "valid";
	const isEnabling = registerStatus === "signing" || registerStatus === "verifying";
	const needsTrading = status !== "valid" && status !== "loading";

	useEffect(() => {
		if (prevStatusRef.current !== "valid" && status === "valid" && pendingActionRef.current) {
			const action = pendingActionRef.current;
			pendingActionRef.current = null;
			action();
		}
		prevStatusRef.current = status;
	}, [status]);

	const enableTrading = useCallback(() => {
		if (isEnabling) return;
		registerAgent().catch(() => {});
	}, [isEnabling, registerAgent]);

	const guardAction = useCallback(
		(action: PendingAction) => {
			if (isReady) {
				action();
				return;
			}
			pendingActionRef.current = action;
			enableTrading();
		},
		[isReady, enableTrading],
	);

	return {
		isReady,
		isEnabling,
		needsTrading,
		enableTrading,
		guardAction,
		error,
	};
}
