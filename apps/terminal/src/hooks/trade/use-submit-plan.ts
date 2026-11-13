import { t } from "@lingui/core/macro";
import { TransportError, type TwapHistoryResponse, type TwapOrderParameters } from "@nktkas/hyperliquid";
import Big from "big.js";
import { useState } from "react";
import { useConnection } from "wagmi";
import {
	assignCloids,
	type CloidOrder,
	createPlanId,
	describePlanLegs,
	getPlanKey,
	type OrderPlan,
	type PlanLeg,
} from "@/domain/trade/order-intent";
import { getInfoClient, useExchange } from "@/lib/hyperliquid";
import {
	describeLegStates,
	hasLanded,
	interpretOrderStatuses,
	type LegState,
	lookupToLegState,
	type OrderResult,
	type PlanReport,
	readThrownStatuses,
	reportLegStates,
} from "@/lib/trade/extract-order-status";

export type SubmitPlanInput = Pick<OrderPlan, "orders" | "grouping"> & { errors?: string[] };

interface UseSubmitPlanResult {
	submitPlan: (plan: SubmitPlanInput) => Promise<OrderResult>;
	submitTwap: (action: TwapOrderParameters) => Promise<OrderResult>;
	isSubmitting: boolean;
}

const RECONCILE_DELAYS_MS = [1000, 2000, 4000];
const STATUS_READ_TIMEOUT_MS = 3000;
const TWAP_CLOCK_SKEW_MS = 5 * 60 * 1000;

const unsettledPlanIds = new Map<string, string>();
const sendingPlanKeys = new Set<string>();
const unsettledTwapSince = new Map<string, number>();
const confirmedTwapIds = new Set<number>();

export function useSubmitPlan(): UseSubmitPlanResult {
	const { address } = useConnection();
	const { mutateAsync: placeOrder } = useExchange("order");
	const { mutateAsync: placeTwapOrder } = useExchange("twapOrder");
	const [activeSubmits, setActiveSubmits] = useState(0);

	async function sendOnce(key: string, send: (key: string) => Promise<OrderResult>): Promise<OrderResult> {
		const walletKey = `${address ?? ""}:${key}`;
		if (sendingPlanKeys.has(walletKey)) return { ok: false, error: t`This order is already being sent` };
		sendingPlanKeys.add(walletKey);
		setActiveSubmits((count) => count + 1);
		try {
			return await send(walletKey);
		} finally {
			sendingPlanKeys.delete(walletKey);
			setActiveSubmits((count) => count - 1);
		}
	}

	function submitPlan(plan: SubmitPlanInput): Promise<OrderResult> {
		if (plan.errors && plan.errors.length > 0) {
			return Promise.resolve({ ok: false, error: plan.errors.join("; ") });
		}
		return sendOnce(getPlanKey(plan), (planKey) => settlePlan(plan, planKey));
	}

	function submitTwap(action: TwapOrderParameters): Promise<OrderResult> {
		return sendOnce(JSON.stringify(action), (twapKey) => settleTwap(action, twapKey));
	}

	async function settleTwap(action: TwapOrderParameters, twapKey: string): Promise<OrderResult> {
		const heldSince = unsettledTwapSince.get(twapKey);
		if (heldSince !== undefined) {
			const history = await readTwapHistory(address);
			if (!history) return { ok: false, error: t`TWAP status unknown. Check the TWAP tab before you try again.` };
			const landed = findStartedTwap(history, action, heldSince);
			if (landed) {
				confirmTwap(landed.twapId);
				unsettledTwapSince.delete(twapKey);
				return { ok: false, error: t`Not sent again. The exchange already has this TWAP. Check the TWAP tab.` };
			}
		}

		const since = heldSince ?? Date.now();
		unsettledTwapSince.set(twapKey, since);
		try {
			const result = await placeTwapOrder(action);
			confirmTwap(result.response?.data?.status?.running?.twapId);
			unsettledTwapSince.delete(twapKey);
			return { ok: true, outcome: "twapStarted" };
		} catch (error) {
			const message = error instanceof Error ? error.message : t`Order failed`;
			if (!(error instanceof TransportError)) {
				unsettledTwapSince.delete(twapKey);
				return { ok: false, error: message };
			}
			const history = await pollUntil(
				() => readTwapHistory(address),
				(latest) => !!findStartedTwap(latest, action, since),
			);
			if (!history)
				return { ok: false, error: t`TWAP status unknown: ${message}. Check the TWAP tab before you try again.` };
			const landed = findStartedTwap(history, action, since);
			if (!landed) return { ok: false, error: message };
			confirmTwap(landed.twapId);
			unsettledTwapSince.delete(twapKey);
			return { ok: true, outcome: "twapStarted" };
		}
	}

	async function settlePlan(plan: SubmitPlanInput, planKey: string): Promise<OrderResult> {
		const legs = describePlanLegs(plan);
		const heldPlanId = unsettledPlanIds.get(planKey);
		const planId = heldPlanId ?? createPlanId();
		const orders = assignCloids(plan.orders, planId);

		if (heldPlanId) {
			const states = await readLegStates(orders, address);
			if (!states) return { ok: false, error: t`Order status unknown. Check open orders before you try again.` };
			if (states.some(hasLanded)) {
				if (reportLegStates(states, legs).settled) unsettledPlanIds.delete(planKey);
				return { ok: false, error: t`Not sent again. ${describeLegStates(states, legs)}` };
			}
		}

		unsettledPlanIds.set(planKey, planId);
		const report = await placeAndReport(orders, plan.grouping, legs);
		if (report.settled) unsettledPlanIds.delete(planKey);
		return report.result;
	}

	async function placeAndReport(
		orders: CloidOrder[],
		grouping: SubmitPlanInput["grouping"],
		legs: PlanLeg[],
	): Promise<PlanReport> {
		try {
			const result = await placeOrder({ orders, grouping });
			return interpretOrderStatuses(result.response?.data?.statuses ?? [], legs);
		} catch (error) {
			const statuses = readThrownStatuses(error);
			if (statuses) return interpretOrderStatuses(statuses, legs);
			const message = error instanceof Error ? error.message : t`Order failed`;
			if (!(error instanceof TransportError)) return { result: { ok: false, error: message }, settled: true };
			return reconcileUnknownOutcome(orders, legs, message);
		}
	}

	async function reconcileUnknownOutcome(orders: CloidOrder[], legs: PlanLeg[], message: string): Promise<PlanReport> {
		const states = await pollUntil(
			() => readLegStates(orders, address),
			(latest) => latest.every((state) => state.status !== "missing"),
		);
		if (!states) {
			const error = t`Order status unknown: ${message}. Check open orders before you try again.`;
			return { result: { ok: false, error }, settled: false };
		}
		if (!states.some(hasLanded)) return { result: { ok: false, error: message }, settled: false };
		return reportLegStates(states, legs);
	}

	return { submitPlan, submitTwap, isSubmitting: activeSubmits > 0 };
}

async function pollUntil<T>(read: () => Promise<T | null>, isSettled: (latest: T) => boolean): Promise<T | null> {
	let latest: T | null = null;
	for (const delay of RECONCILE_DELAYS_MS) {
		await new Promise((resolve) => setTimeout(resolve, delay));
		latest = (await read()) ?? latest;
		if (latest && isSettled(latest)) return latest;
	}
	return latest;
}

async function readLegStates(orders: CloidOrder[], user: `0x${string}` | undefined): Promise<LegState[] | null> {
	if (!user) return null;
	const info = getInfoClient();
	const signal = AbortSignal.timeout(STATUS_READ_TIMEOUT_MS);
	try {
		const lookups = await Promise.all(orders.map((order) => info.orderStatus({ user, oid: order.c }, signal)));
		return lookups.map(lookupToLegState);
	} catch {
		return null;
	}
}

function confirmTwap(twapId: number | undefined) {
	if (twapId !== undefined) confirmedTwapIds.add(twapId);
}

function findStartedTwap(
	history: TwapHistoryResponse,
	{ twap }: TwapOrderParameters,
	since: number,
): TwapHistoryResponse[number] | undefined {
	const side = twap.b ? "B" : "A";
	return history.find(
		({ state, twapId }) =>
			(twapId === undefined || !confirmedTwapIds.has(twapId)) &&
			state.timestamp >= since - TWAP_CLOCK_SKEW_MS &&
			state.side === side &&
			state.minutes === twap.m &&
			state.reduceOnly === twap.r &&
			state.randomize === twap.t &&
			Big(state.sz).eq(twap.s),
	);
}

async function readTwapHistory(user: `0x${string}` | undefined): Promise<TwapHistoryResponse | null> {
	if (!user) return null;
	try {
		return await getInfoClient().twapHistory({ user }, AbortSignal.timeout(STATUS_READ_TIMEOUT_MS));
	} catch {
		return null;
	}
}
