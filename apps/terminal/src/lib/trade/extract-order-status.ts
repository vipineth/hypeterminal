import { t } from "@lingui/core/macro";
import type { OrderStatusResponse } from "@nktkas/hyperliquid";
import type { PlanLeg } from "@/domain/trade/order-intent";

export type OrderOutcome = "filled" | "resting" | "triggerSet" | "twapStarted";

export type OrderResult = { ok: true; outcome: OrderOutcome } | { ok: false; error: string };

type PlacedOutcome = Exclude<OrderOutcome, "twapStarted">;

export type LegState =
	| { status: "placed"; outcome: PlacedOutcome }
	| { status: "rejected"; reason?: string }
	| { status: "canceled" }
	| { status: "missing" };

export type PlanReport = { result: OrderResult; settled: boolean };

export const NO_EXCHANGE_RESPONSE = "No response from exchange";

const UNNAMED_LEG: PlanLeg = { role: "order", price: "" };

export function interpretOrderStatuses(statuses: unknown[], legs: PlanLeg[]): PlanReport {
	if (statuses.length === 0) return { result: { ok: false, error: NO_EXCHANGE_RESPONSE }, settled: false };
	return reportLegStates(statuses.map(toLegState), legs);
}

export function reportLegStates(states: LegState[], legs: PlanLeg[]): PlanReport {
	const settled =
		states.every((state) => state.status === "placed") || states.every((state) => state.status === "rejected");
	return { result: summarizeLegStates(states, legs), settled };
}

export function readThrownStatuses(error: unknown): unknown[] | null {
	if (!isRecord(error) || !isRecord(error.response)) return null;
	const { response } = error.response;
	const data = isRecord(response) ? response.data : undefined;
	const statuses = isRecord(data) ? data.statuses : undefined;
	return Array.isArray(statuses) ? statuses : null;
}

function toLegState(status: unknown): LegState {
	if (status === "waitingForTrigger") return { status: "placed", outcome: "triggerSet" };
	if (status === "waitingForFill") return { status: "placed", outcome: "resting" };
	if (isRecord(status)) {
		if (typeof status.error === "string") return { status: "rejected", reason: status.error };
		if ("resting" in status) return { status: "placed", outcome: "resting" };
	}
	return { status: "placed", outcome: "filled" };
}

export function lookupToLegState(lookup: OrderStatusResponse): LegState {
	if (lookup.status === "unknownOid") return { status: "missing" };
	const { status, order } = lookup.order;
	if (status === "filled") return { status: "placed", outcome: "filled" };
	if (status === "open" || status === "triggered") {
		return { status: "placed", outcome: order.isTrigger ? "triggerSet" : "resting" };
	}
	if (status === "rejected" || status.endsWith("Rejected")) return { status: "rejected" };
	return { status: "canceled" };
}

export function hasLanded(state: LegState): boolean {
	return state.status === "placed" || state.status === "canceled";
}

function summarizeLegStates(states: LegState[], legs: PlanLeg[]): OrderResult {
	const [primary] = states;
	if (primary?.status === "placed" && states.every((state) => state.status === "placed")) {
		return { ok: true, outcome: primary.outcome };
	}
	const reasons = new Set(states.map((state) => (state.status === "rejected" ? state.reason : undefined)));
	const [onlyReason] = reasons;
	if (reasons.size === 1 && onlyReason) return { ok: false, error: onlyReason };
	return { ok: false, error: describeLegStates(states, legs) };
}

export function describeLegStates(states: LegState[], legs: PlanLeg[]): string {
	const placedScaleLegs = states.filter(
		(state, index) => state.status === "placed" && (legs[index] ?? UNNAMED_LEG).role === "scaleLeg",
	).length;
	const sentences = states.flatMap((state, index) => {
		const leg = legs[index] ?? UNNAMED_LEG;
		if (state.status === "placed" && leg.role === "scaleLeg") return [];
		return [describeLegState(leg, index, state)];
	});
	if (placedScaleLegs > 0) sentences.unshift(t`${placedScaleLegs} of ${states.length} legs placed`);
	return sentences.join(". ");
}

function describeLegState(leg: PlanLeg, index: number, state: LegState): string {
	const name = getLegName(leg, index);
	switch (state.status) {
		case "placed":
			return describePlacedLeg(name, leg, state.outcome);
		case "rejected":
			return state.reason ? t`${name} rejected: ${state.reason}` : t`${name} rejected`;
		case "canceled":
			return t`${name} canceled`;
		case "missing":
			return t`${name} not found on the exchange`;
	}
}

function describePlacedLeg(name: string, leg: PlanLeg, outcome: PlacedOutcome): string {
	if (leg.role === "takeProfit" || leg.role === "stopLoss" || outcome === "triggerSet") return t`${name} set`;
	if (outcome === "resting") return t`${name} placed`;
	return t`${name} filled`;
}

function getLegName(leg: PlanLeg, index: number): string {
	const legNumber = index + 1;
	switch (leg.role) {
		case "entry":
			return t`Entry`;
		case "takeProfit":
			return t`Take profit`;
		case "stopLoss":
			return t`Stop loss`;
		case "scaleLeg":
			return t`Leg ${legNumber} at ${leg.price}`;
		case "order":
			return t`Order`;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
