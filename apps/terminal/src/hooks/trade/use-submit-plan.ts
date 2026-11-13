import { useHyperliquidClients } from "@hypeterminal/hl-react";
import { t } from "@lingui/core/macro";
import type { TwapOrderParameters } from "@nktkas/hyperliquid";
import { useEffect, useSyncExternalStore } from "react";
import { useConnection } from "wagmi";
import { assignCloids, createPlanId, describePlanLegs, type OrderPlan } from "@/domain/trade/order-intent";
import { getInfoClient, useHyperliquid } from "@/lib/hyperliquid";
import { getBrowserLocks, getBrowserStorage, subscribeToStorageEvents } from "@/lib/trade/browser-env";
import { createExchangeClock } from "@/lib/trade/exchange-clock";
import {
	type OrderResult,
	reportRequestOutcome,
	reportSettlement,
	reportSubmit,
} from "@/lib/trade/extract-order-status";
import {
	type CancelOutcome,
	createOrderSender,
	getRequestKey,
	type Signer,
	type SubmitOutcome,
} from "@/lib/trade/order-sender";
import { createRequestStore, type PendingRequest, type RequestLabel } from "@/lib/trade/pending-requests";
import { resultToQueueUpdate, useOrderQueueActions } from "@/stores/use-order-queue-store";

const CLOCK_READ_TIMEOUT_MS = 3000;
const NO_REQUESTS: PendingRequest[] = [];

const sender = createOrderSender({
	info: getInfoClient,
	store: createRequestStore(getBrowserStorage, subscribeToStorageEvents),
	clock: createExchangeClock(
		async () => (await getInfoClient().exchangeStatus(AbortSignal.timeout(CLOCK_READ_TIMEOUT_MS))).time,
		() => performance.now(),
	),
	locks: getBrowserLocks,
});

let pendingSnapshot = { key: "", requests: NO_REQUESTS };

function readPendingRequests(user: string | undefined): PendingRequest[] {
	const requests = user ? sender.list(user) : NO_REQUESTS;
	const key = requests.map(getRequestKey).join("|");
	if (key !== pendingSnapshot.key) pendingSnapshot = { key, requests };
	return pendingSnapshot.requests;
}

export type SubmitPlanInput = Pick<OrderPlan, "orders" | "grouping"> & { errors?: string[] };

interface UseSubmitPlanResult {
	submitPlan: (plan: SubmitPlanInput, label?: RequestLabel) => Promise<OrderResult>;
	submitTwap: (action: TwapOrderParameters, target: { coin: string; label?: RequestLabel }) => Promise<OrderResult>;
	retryRequest: (requestKey: string) => Promise<OrderResult>;
	cancelRequest: (requestKey: string) => Promise<OrderResult>;
	isSubmitting: boolean;
}

export function useSubmitPlan(): UseSubmitPlanResult {
	const { address } = useConnection();
	const { trading } = useHyperliquidClients();
	const { builderConfig } = useHyperliquid();
	const { updateByRequestKey } = useOrderQueueActions();
	const isSubmitting = useSyncExternalStore(sender.subscribeBusy, sender.isBusy, sender.isBusy);

	useEffect(() => {
		sender.warmClock();
	}, []);

	function getSigner(): Signer | null {
		const config = trading?.config_;
		if (!address || !config || !("wallet" in config)) return null;
		return { user: address, config };
	}

	async function send(submit: (signer: Signer) => Promise<SubmitOutcome>): Promise<OrderResult> {
		const signer = getSigner();
		if (!signer) return { ok: false, error: t`Wallet is required for exchange actions` };
		const outcome = await submit(signer);
		if (outcome.kind === "blocked") {
			const earlierKey = getRequestKey(outcome.earlier.request);
			updateByRequestKey(earlierKey, resultToQueueUpdate(reportSettlement(outcome.earlier)));
		}
		return reportSubmit(outcome);
	}

	function submitPlan(plan: SubmitPlanInput, label?: RequestLabel): Promise<OrderResult> {
		if (plan.errors && plan.errors.length > 0) {
			return Promise.resolve({ ok: false, error: plan.errors.join("; ") });
		}
		return send((signer) =>
			sender.submit(signer, {
				kind: "order",
				params: { orders: assignCloids(plan.orders, createPlanId()), grouping: plan.grouping, builder: builderConfig },
				legs: describePlanLegs(plan),
				label: label ?? null,
			}),
		);
	}

	function submitTwap(action: TwapOrderParameters, target: { coin: string; label?: RequestLabel }) {
		return send((signer) =>
			sender.submit(signer, { kind: "twap", params: action, coin: target.coin, label: target.label ?? null }),
		);
	}

	async function settleRequest(requestKey: string, act: () => Promise<CancelOutcome>): Promise<OrderResult> {
		const outcome = await act();
		const result = reportRequestOutcome(outcome);
		if (outcome.kind !== "busy") updateByRequestKey(requestKey, resultToQueueUpdate(result));
		return result;
	}

	function retryRequest(requestKey: string): Promise<OrderResult> {
		return settleRequest(requestKey, () => sender.retry(requestKey));
	}

	function cancelRequest(requestKey: string): Promise<OrderResult> {
		const signer = getSigner();
		if (!signer) return Promise.resolve({ ok: false, error: t`Wallet is required for exchange actions` });
		return settleRequest(requestKey, () => sender.cancel(signer, requestKey));
	}

	return { submitPlan, submitTwap, retryRequest, cancelRequest, isSubmitting };
}

export function usePendingRequests(): PendingRequest[] {
	const { address } = useConnection();
	return useSyncExternalStore(
		sender.subscribe,
		() => readPendingRequests(address),
		() => NO_REQUESTS,
	);
}
