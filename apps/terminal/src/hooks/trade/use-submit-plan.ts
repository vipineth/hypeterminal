import { useHyperliquidClients } from "@hypeterminal/hl-react";
import { t } from "@lingui/core/macro";
import type { TwapOrderParameters } from "@nktkas/hyperliquid";
import { useEffect, useSyncExternalStore } from "react";
import { useConnection } from "wagmi";
import { assignCloids, createPlanId, describePlanLegs, type OrderPlan } from "@/domain/trade/order-intent";
import { getInfoClient, useHyperliquid } from "@/lib/hyperliquid";
import { getBrowserChangeBus, getBrowserKeyValue, getBrowserLocks } from "@/lib/trade/browser-env";
import { createExchangeClock } from "@/lib/trade/exchange-clock";
import {
	describeInspection,
	type OrderResult,
	reportEarlier,
	reportHoldOutcome,
	reportRequestOutcome,
	reportSubmit,
	reportUnreadableOutcome,
} from "@/lib/trade/extract-order-status";
import {
	createOrderSender,
	getRequestKey,
	type Lookup,
	type Signer,
	type SubmitOutcome,
} from "@/lib/trade/order-sender";
import {
	createRequestStore,
	type PendingRequest,
	type RequestLabel,
	type SlotHold,
} from "@/lib/trade/pending-requests";
import { resultToQueueUpdate, useOrderQueueActions } from "@/stores/use-order-queue-store";

const CLOCK_READ_TIMEOUT_MS = 3000;
const NO_REQUESTS: PendingRequest[] = [];
const NO_HOLDS: SlotHold[] = [];

const sender = createOrderSender({
	info: getInfoClient,
	store: createRequestStore(getBrowserKeyValue, getBrowserChangeBus()),
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

let holdSnapshot = { key: "", holds: NO_HOLDS };

function readActiveHolds(user: string | undefined): SlotHold[] {
	const holds = user ? sender.listHolds(user) : NO_HOLDS;
	const key = holds.map(({ slot, hold }) => `${slot}#${hold.nonce}:${hold.fates.join()}`).join("|");
	if (key !== holdSnapshot.key) holdSnapshot = { key, holds };
	return holdSnapshot.holds;
}

export type SubmitPlanInput = Pick<OrderPlan, "orders" | "grouping"> & { errors?: string[] };

export type DismissPreview =
	| { kind: "confirm"; text: string; lookup: Lookup }
	| { kind: "result"; result: OrderResult };

function labelFromLeg(leg: OrderPlan["orders"][number]): RequestLabel {
	return { market: "", side: leg.b ? "buy" : "sell", size: leg.s };
}

interface UseSubmitPlanResult {
	submitPlan: (plan: SubmitPlanInput, label?: RequestLabel) => Promise<OrderResult>;
	submitTwap: (action: TwapOrderParameters, target: { coin: string; label: RequestLabel }) => Promise<OrderResult>;
	retryRequest: (requestKey: string) => Promise<OrderResult>;
	cancelRequest: (requestKey: string) => Promise<OrderResult>;
	previewDismiss: (requestKey: string) => Promise<DismissPreview>;
	dismissRequest: (requestKey: string, lookup: Lookup) => Promise<OrderResult>;
	dismissUnreadable: (slot: string, raw: string) => Promise<OrderResult>;
	dismissHold: (held: SlotHold) => Promise<OrderResult>;
	canCancel: boolean;
	isSubmitting: boolean;
}

export function useSubmitPlan(): UseSubmitPlanResult {
	const { address } = useConnection();
	const { trading } = useHyperliquidClients();
	const { builderConfig } = useHyperliquid();
	const { upsertByRequestKey } = useOrderQueueActions();
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
		if (!signer) return { ok: false, status: "notSent", error: t`Wallet is required for exchange actions` };
		const outcome = await submit(signer);
		if (outcome.kind === "blocked") {
			const { request } = outcome.earlier;
			upsertByRequestKey(getRequestKey(request), request.label, resultToQueueUpdate(reportEarlier(outcome.earlier)));
		}
		return reportSubmit(outcome);
	}

	function submitPlan(plan: SubmitPlanInput, label?: RequestLabel): Promise<OrderResult> {
		if (plan.errors && plan.errors.length > 0) {
			return Promise.resolve({ ok: false, status: "notSent", error: plan.errors.join("; ") });
		}
		return send((signer) =>
			sender.submit(signer, {
				kind: "order",
				params: { orders: assignCloids(plan.orders, createPlanId()), grouping: plan.grouping, builder: builderConfig },
				legs: describePlanLegs(plan),
				label: label ?? labelFromLeg(plan.orders[0]),
			}),
		);
	}

	function submitTwap(action: TwapOrderParameters, target: { coin: string; label: RequestLabel }) {
		return send((signer) => sender.submit(signer, { kind: "twap", params: action, ...target }));
	}

	async function retryRequest(requestKey: string): Promise<OrderResult> {
		return reportRequestOutcome(await sender.retry(requestKey));
	}

	async function cancelRequest(requestKey: string): Promise<OrderResult> {
		const signer = getSigner();
		if (!signer) return { ok: false, status: "notSent", error: t`Wallet is required for exchange actions` };
		return reportRequestOutcome(await sender.cancel(signer, requestKey));
	}

	async function previewDismiss(requestKey: string): Promise<DismissPreview> {
		const inspection = await sender.inspect(requestKey, getSigner());
		if (inspection.kind === "inspected") {
			return { kind: "confirm", text: describeInspection(inspection), lookup: inspection.lookup };
		}
		return { kind: "result", result: reportRequestOutcome(inspection) };
	}

	async function dismissRequest(requestKey: string, lookup: Lookup): Promise<OrderResult> {
		return reportRequestOutcome(await sender.dismiss(requestKey, lookup, getSigner()));
	}

	async function dismissUnreadable(slot: string, raw: string): Promise<OrderResult> {
		return reportUnreadableOutcome(await sender.dismissUnreadable(slot, raw));
	}

	async function dismissHold({ slot, hold }: SlotHold): Promise<OrderResult> {
		return reportHoldOutcome(await sender.dismissHold(slot, hold));
	}

	return {
		submitPlan,
		submitTwap,
		retryRequest,
		cancelRequest,
		previewDismiss,
		dismissRequest,
		dismissUnreadable,
		dismissHold,
		canCancel: getSigner() !== null,
		isSubmitting,
	};
}

export function usePendingRequests(): PendingRequest[] {
	const { address } = useConnection();
	return useSyncExternalStore(
		sender.subscribe,
		() => readPendingRequests(address),
		() => NO_REQUESTS,
	);
}

export function useActiveHolds(): SlotHold[] {
	const { address } = useConnection();
	return useSyncExternalStore(
		sender.subscribe,
		() => readActiveHolds(address),
		() => NO_HOLDS,
	);
}
