import { t } from "@lingui/core/macro";
import type { OrderStatusResponse } from "@nktkas/hyperliquid";
import type { PlanLeg } from "@/domain/trade/order-intent";
import {
	type CancelOutcome,
	getRequestKey,
	type Lookup,
	type Settlement,
	type SubmitOutcome,
} from "@/lib/trade/order-sender";
import type { PendingRequest } from "@/lib/trade/pending-requests";

export type OrderOutcome = "filled" | "partiallyFilled" | "resting" | "triggerSet" | "twapStarted";

export type OrderResult =
	| { ok: true; outcome: OrderOutcome; detail?: string }
	| { ok: false; error: string; requestKey?: string };

type PlacedOutcome = Exclude<OrderOutcome, "twapStarted" | "partiallyFilled">;

export type LegState =
	| { status: "placed"; outcome: PlacedOutcome }
	| { status: "rejected"; reason?: string }
	| { status: "canceled" }
	| { status: "missing" };

export const NO_EXCHANGE_RESPONSE = "No response from exchange";

const UNNAMED_LEG: PlanLeg = { role: "order", price: "" };

export function interpretOrderStatuses(statuses: unknown[], legs: PlanLeg[]): OrderResult {
	if (statuses.length === 0) return { ok: false, error: NO_EXCHANGE_RESPONSE };
	return summarizeLegStates(statuses.map(toLegState), legs);
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

function summarizeLegStates(states: LegState[], legs: PlanLeg[]): OrderResult {
	const placed = states.flatMap((state, index) => (state.status === "placed" ? [{ state, index }] : []));
	if (placed.length === states.length) return summarizePlaced(states, legs);
	const reasons = new Set(states.map((state) => (state.status === "rejected" ? state.reason : undefined)));
	const [onlyReason] = reasons;
	if (reasons.size === 1 && onlyReason) return { ok: false, error: onlyReason };
	return { ok: false, error: describeLegStates(states, legs) };
}

function summarizePlaced(states: LegState[], legs: PlanLeg[]): OrderResult {
	const outcomes = states.flatMap((state, index) => {
		const role = (legs[index] ?? UNNAMED_LEG).role;
		const isChild = role === "takeProfit" || role === "stopLoss";
		return state.status === "placed" && !isChild ? [state.outcome] : [];
	});
	const [first] = outcomes;
	const primary = states[0]?.status === "placed" ? states[0].outcome : "resting";
	if (outcomes.every((outcome) => outcome === first)) return { ok: true, outcome: first ?? primary };
	const filled = outcomes.filter((outcome) => outcome === "filled").length;
	const resting = outcomes.length - filled;
	const total = outcomes.length;
	return { ok: true, outcome: "partiallyFilled", detail: t`${filled} of ${total} legs filled, ${resting} placed` };
}

function describeLegStates(states: LegState[], legs: PlanLeg[]): string {
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

export function reportSubmit(outcome: SubmitOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return { ok: false, error: t`This order is already being sent` };
		case "failed":
			return { ok: false, error: t`Not sent: ${outcome.error}` };
		case "blocked":
			return reportBlocked(outcome.earlier);
		case "sent":
			return reportSettlement(outcome.settlement);
	}
}

function reportBlocked(earlier: Settlement): OrderResult {
	if (earlier.kind === "pending") {
		const error = t`Not sent. An earlier order on this market is not confirmed yet. Retry or cancel it first.`;
		return { ok: false, error, requestKey: getRequestKey(earlier.request) };
	}
	const result = reportSettlement(earlier);
	const what = result.ok ? describeOutcome(result.outcome) : result.error;
	return {
		ok: false,
		error: t`Not sent. An earlier order on this market was still unconfirmed: ${what}. Press again to send a new order.`,
	};
}

function describeOutcome(outcome: OrderOutcome): string {
	switch (outcome) {
		case "filled":
			return t`it filled`;
		case "partiallyFilled":
			return t`it partly filled`;
		case "resting":
			return t`it was placed`;
		case "triggerSet":
			return t`it was set`;
		case "twapStarted":
			return t`the TWAP started`;
	}
}

export function reportRequestOutcome(outcome: CancelOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return { ok: false, error: t`This order is already being sent` };
		case "missing":
			return { ok: false, error: t`This request was already settled. Check open orders.` };
		case "foreignSigner": {
			const expiry = new Date(outcome.request.expiresAfter).toLocaleTimeString();
			const error = t`Cannot cancel: another agent key signed this order. It expires at ${expiry}.`;
			return { ok: false, error, requestKey: getRequestKey(outcome.request) };
		}
		default:
			return reportSettlement(outcome);
	}
}

export function reportSettlement(settlement: Settlement): OrderResult {
	const { request } = settlement;
	switch (settlement.kind) {
		case "pending":
			return {
				ok: false,
				error: t`Not confirmed: ${settlement.error}. Retry or cancel it.`,
				requestKey: getRequestKey(request),
			};
		case "canceled":
			return {
				ok: false,
				error: request.kind === "twap" ? t`Canceled. The TWAP did not start.` : t`Canceled. Nothing was placed.`,
			};
		case "answered":
			return request.kind === "twap"
				? reportTwapReply(settlement.response)
				: interpretOrderStatuses(readStatuses(settlement.response), request.legs);
		case "consumed":
			if (settlement.rejection && foundNothing(settlement.lookup)) return { ok: false, error: settlement.rejection };
			return reportLookup(settlement.lookup, request.legs);
		case "expired":
		case "lapsed":
			if (!foundNothing(settlement.lookup)) return reportLookup(settlement.lookup, request.legs);
			if (settlement.rejection) return { ok: false, error: t`Not sent: ${settlement.rejection}` };
			return reportExpired(request.kind);
	}
}

function reportLookup(lookup: Lookup, legs: PlanLeg[]): OrderResult {
	if (lookup.kind === "twap") {
		if (lookup.match) {
			const { status } = lookup.match;
			if (status.status === "error") return { ok: false, error: t`TWAP failed: ${status.description}` };
			return { ok: true, outcome: "twapStarted" };
		}
		if (!lookup.readable) {
			return {
				ok: false,
				error: t`TWAP sent. Its status could not be read. It will not be sent again. Check the TWAP tab.`,
			};
		}
		return { ok: false, error: t`TWAP sent but not listed yet. It will not be sent again. Check the TWAP tab.` };
	}
	if (!lookup.statuses) {
		return {
			ok: false,
			error: t`Order sent. Its status could not be read. It will not be sent again. Check open orders.`,
		};
	}
	const states = lookup.statuses.map(lookupToLegState);
	const result = summarizeLegStates(states, legs);
	if (result.ok || !states.some((state) => state.status === "missing")) return result;
	return { ok: false, error: t`${result.error}. It will not be sent again. Check open orders.` };
}

function foundNothing(lookup: Lookup): boolean {
	if (lookup.kind === "twap") return lookup.match === null;
	return lookup.statuses?.every((status) => status.status === "unknownOid") === true;
}

function reportExpired(kind: PendingRequest["kind"]): OrderResult {
	if (kind === "twap") return { ok: false, error: t`Not started. The request expired before the exchange took it.` };
	return { ok: false, error: t`Not placed. The request expired before the exchange took it.` };
}

function reportTwapReply(response: unknown): OrderResult {
	const data = isRecord(response) && isRecord(response.data) ? response.data : null;
	const status = data && isRecord(data.status) ? data.status : null;
	if (status && typeof status.error === "string") return { ok: false, error: status.error };
	if (status && "running" in status) return { ok: true, outcome: "twapStarted" };
	return { ok: false, error: NO_EXCHANGE_RESPONSE };
}

function readStatuses(response: unknown): unknown[] {
	const data = isRecord(response) && isRecord(response.data) ? response.data : null;
	return data && Array.isArray(data.statuses) ? data.statuses : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
