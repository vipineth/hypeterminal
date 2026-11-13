import { t } from "@lingui/core/macro";
import { TransportError } from "@nktkas/hyperliquid";
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
	isSubmitting: boolean;
}

const RECONCILE_DELAYS_MS = [1000, 2000, 4000];
const STATUS_READ_TIMEOUT_MS = 3000;

const unsettledPlanIds = new Map<string, string>();
const sendingPlanKeys = new Set<string>();

export function useSubmitPlan(): UseSubmitPlanResult {
	const { address } = useConnection();
	const { mutateAsync: placeOrder } = useExchange("order");
	const [activeSubmits, setActiveSubmits] = useState(0);

	async function submitPlan(plan: SubmitPlanInput): Promise<OrderResult> {
		if (plan.errors && plan.errors.length > 0) {
			return { ok: false, error: plan.errors.join("; ") };
		}
		const planKey = `${address ?? ""}:${getPlanKey(plan)}`;
		if (sendingPlanKeys.has(planKey)) return { ok: false, error: t`This order is already being sent` };
		sendingPlanKeys.add(planKey);
		setActiveSubmits((count) => count + 1);
		try {
			return await settlePlan(plan, planKey);
		} finally {
			sendingPlanKeys.delete(planKey);
			setActiveSubmits((count) => count - 1);
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
		const states = await pollLegStates(orders, address);
		if (!states) {
			const error = t`Order status unknown: ${message}. Check open orders before you try again.`;
			return { result: { ok: false, error }, settled: false };
		}
		if (!states.some(hasLanded)) return { result: { ok: false, error: message }, settled: false };
		return reportLegStates(states, legs);
	}

	return { submitPlan, isSubmitting: activeSubmits > 0 };
}

async function pollLegStates(orders: CloidOrder[], user: `0x${string}` | undefined): Promise<LegState[] | null> {
	let latest: LegState[] | null = null;
	for (const delay of RECONCILE_DELAYS_MS) {
		await new Promise((resolve) => setTimeout(resolve, delay));
		latest = (await readLegStates(orders, user)) ?? latest;
		if (latest?.every((state) => state.status !== "missing")) return latest;
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
