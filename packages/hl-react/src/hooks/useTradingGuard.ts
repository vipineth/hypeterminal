import { useEffect, useRef, useState } from "react";
import { useAgentRegistration } from "../signing/use-agent-registration";
import { useAgentStatus } from "../signing/use-agent-status";

type PendingAction = () => void | Promise<void>;

interface UseTradingGuardResult {
	isReady: boolean;
	isEnabling: boolean;
	needsTrading: boolean;
	enableTrading: () => void;
	guardAction: () => void;
	error: Error | null;
	clearError: () => void;
}

function toError(err: unknown): Error {
	return err instanceof Error ? err : new Error(String(err));
}

export function useTradingGuard(action: PendingAction, disabled: boolean): UseTradingGuardResult {
	const { isReady, isLoading, signaturesRequired } = useAgentStatus();
	const { register: registerAgent, status: registerStatus, error: agentError } = useAgentRegistration();
	const isQueuedRef = useRef(false);
	const prevIsReadyRef = useRef(isReady);
	const [localError, setLocalError] = useState<Error | null>(null);

	const isEnabling =
		registerStatus === "approving_fee" || registerStatus === "approving_agent" || registerStatus === "verifying";
	const needsTrading = !isLoading && signaturesRequired > 0;

	useEffect(() => {
		const wasReady = prevIsReadyRef.current;
		prevIsReadyRef.current = isReady;

		if (wasReady && !isReady) isQueuedRef.current = false;
		if (wasReady || !isReady || !isQueuedRef.current) return;

		isQueuedRef.current = false;
		if (disabled) return;
		Promise.resolve(action()).catch((err) => setLocalError(toError(err)));
	}, [isReady, disabled, action]);

	function enableTrading() {
		if (isEnabling) return;
		setLocalError(null);
		registerAgent().catch((err) => {
			isQueuedRef.current = false;
			setLocalError(toError(err));
		});
	}

	function guardAction() {
		if (isReady) {
			Promise.resolve(action()).catch((err) => setLocalError(toError(err)));
			return;
		}
		isQueuedRef.current = true;
		enableTrading();
	}

	function clearError() {
		setLocalError(null);
	}

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
