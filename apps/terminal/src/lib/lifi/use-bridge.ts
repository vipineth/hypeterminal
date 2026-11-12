import type { RouteExtended } from "@lifi/sdk";
import { convertQuoteToRoute, executeRoute } from "@lifi/sdk";
import { useRef, useState } from "react";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { getLiFiClient } from "./config";
import type { BridgeQuote } from "./use-quote";

type BridgeStatus = "idle" | "executing" | "success" | "error";

export type BridgeOutcome = "success" | "error" | "rejected";

export interface ProcessDetail {
	type: string;
	txHash: string;
	txLink: string;
	startedAt: number;
	doneAt: number | null;
}

interface BridgeState {
	status: BridgeStatus;
	statusText: string;
	error: string | null;
	txHash: string | null;
	receivedAmount: string | null;
	startTime: number | null;
	endTime: number | null;
	processDetails: ProcessDetail[];
}

const INITIAL_STATE: BridgeState = {
	status: "idle",
	statusText: "",
	error: null,
	txHash: null,
	receivedAmount: null,
	startTime: null,
	endTime: null,
	processDetails: [],
};

function getProcessStatusText(route: RouteExtended): string {
	for (const step of route.steps) {
		if (!step.execution) continue;
		for (const action of step.execution.actions) {
			if (action.status === "DONE") continue;
			if (action.message) return action.message;
			switch (action.type) {
				case "CHECK_ALLOWANCE":
				case "RESET_ALLOWANCE":
				case "SET_ALLOWANCE":
				case "PERMIT":
				case "NATIVE_PERMIT":
					return `Approving ${step.action.fromToken.symbol}...`;
				case "SWAP":
					return `Swapping on ${step.action.fromChainId === step.action.toChainId ? "same chain" : "source chain"}...`;
				case "CROSS_CHAIN":
					return "Bridging to Hyperliquid...";
				case "RECEIVING_CHAIN":
					return "Confirming on destination...";
			}
		}
	}
	return "Processing...";
}

function getLastTxHash(route: RouteExtended): string | null {
	for (let i = route.steps.length - 1; i >= 0; i--) {
		const step = route.steps[i];
		if (!step.execution) continue;
		for (let j = step.execution.actions.length - 1; j >= 0; j--) {
			const action = step.execution.actions[j];
			if (action.txHash) return action.txHash;
		}
	}
	return null;
}

function getAllProcessDetails(route: RouteExtended, doneAtByTxHash: Map<string, number>): ProcessDetail[] {
	const details: ProcessDetail[] = [];
	for (const step of route.steps) {
		if (!step.execution) continue;
		for (const action of step.execution.actions) {
			if (!action.txHash) continue;
			if (action.status === "DONE" && !doneAtByTxHash.has(action.txHash)) {
				doneAtByTxHash.set(action.txHash, Date.now());
			}
			details.push({
				type: action.type,
				txHash: action.txHash,
				txLink: isSafeHttpUrl(action.txLink) ? action.txLink : "",
				startedAt: step.execution.startedAt,
				doneAt: doneAtByTxHash.get(action.txHash) ?? null,
			});
		}
	}
	return details;
}

export function useBridgeExecutor() {
	const [state, setState] = useState<BridgeState>(INITIAL_STATE);
	const executingRef = useRef(false);
	const doneAtByTxHashRef = useRef(new Map<string, number>());

	async function execute(quote: BridgeQuote): Promise<BridgeOutcome> {
		if (executingRef.current) return "error";
		executingRef.current = true;
		doneAtByTxHashRef.current.clear();

		const startedAt = Date.now();
		setState({
			status: "executing",
			statusText: "Preparing transaction...",
			error: null,
			txHash: null,
			receivedAmount: null,
			startTime: startedAt,
			endTime: null,
			processDetails: [],
		});

		try {
			const route = convertQuoteToRoute(quote.step);

			const result = await executeRoute(getLiFiClient(), route, {
				updateRouteHook(updatedRoute) {
					const txHash = getLastTxHash(updatedRoute);
					const statusText = getProcessStatusText(updatedRoute);
					const processDetails = getAllProcessDetails(updatedRoute, doneAtByTxHashRef.current);
					setState((prev) => ({
						...prev,
						statusText,
						txHash: txHash ?? prev.txHash,
						processDetails,
					}));
				},
			});

			const toAmount = result.steps.at(-1)?.execution?.toAmount ?? quote.toAmount;

			setState({
				status: "success",
				statusText: "Bridge complete",
				error: null,
				txHash: getLastTxHash(result),
				receivedAmount: toAmount,
				startTime: startedAt,
				endTime: Date.now(),
				processDetails: getAllProcessDetails(result, doneAtByTxHashRef.current),
			});
			return "success";
		} catch (err) {
			const message = err instanceof Error ? err.message : "Bridge failed";
			const isUserRejection =
				message.includes("rejected") ||
				message.includes("denied") ||
				message.includes("cancelled") ||
				message.includes("user rejected");

			if (isUserRejection) {
				setState((prev) => ({
					...prev,
					status: "idle",
					statusText: "",
					error: null,
					endTime: Date.now(),
				}));
				return "rejected";
			}
			setState((prev) => ({
				...prev,
				status: "error",
				error: message,
				endTime: Date.now(),
			}));
			return "error";
		} finally {
			executingRef.current = false;
		}
	}

	function reset() {
		setState(INITIAL_STATE);
		executingRef.current = false;
	}

	return { ...state, execute, reset };
}
