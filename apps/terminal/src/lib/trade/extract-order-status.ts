import { t } from "@lingui/core/macro";
import type { CloidOrder, PlanLeg } from "@/domain/trade/order-intent";
import {
	isRecord,
	type LegFate,
	type LegState,
	lookupToLegState,
	type PlacedOutcome,
	readStatuses,
	toLegState,
} from "@/lib/trade/leg-state";
import { toBig } from "@/lib/trade/numbers";
import {
	canStillExecute,
	getRequestKey,
	type Held,
	type HoldOutcome,
	type Inspection,
	type Live,
	type Lookup,
	type OrderLookup,
	type Refused,
	type RequestOutcome,
	type Settlement,
	type SubmitOutcome,
	type TwapRecord,
	type UnreadableOutcome,
} from "@/lib/trade/order-sender";
import type { Hold, PendingRequest } from "@/lib/trade/pending-requests";

export type OrderOutcome = "filled" | "partiallyFilled" | "resting" | "triggerSet" | "twapStarted";

export type OrderResult =
	| PlacedResult
	| { ok: false; status: "failed" | "unknown" | "canceled"; error: string }
	| { ok: false; status: "notSent"; error: string; unreadable?: UnreadableSlot }
	| { ok: false; status: "unsettled"; error: string; requestKey: string; canDismiss: boolean; resends: string };

type PlacedResult = { ok: true; outcome: OrderOutcome; detail?: string; avgPx?: string };

export type UnreadableSlot = { slot: string; raw: string };

export const NO_EXCHANGE_RESPONSE = "No response from exchange";

const UNNAMED_LEG: PlanLeg = { role: "order", price: "" };

function failed(error: string): OrderResult {
	return { ok: false, status: "failed", error };
}

function unknown(error: string): OrderResult {
	return { ok: false, status: "unknown", error };
}

function notSent(error: string): OrderResult {
	return { ok: false, status: "notSent", error };
}

function unsettled(request: PendingRequest, error: string, canDismiss: boolean): OrderResult {
	return {
		ok: false,
		status: "unsettled",
		error,
		requestKey: getRequestKey(request),
		canDismiss,
		resends: describeResend(request),
	};
}

export function describeResend(request: PendingRequest): string {
	if (request.kind === "twap") return t`Retry resends this TWAP as you placed it.`;
	const { action } = JSON.parse(request.body) as { action?: { orders?: CloidOrder[] } };
	const legs = request.legs.map((leg, index) => describeSentLeg(leg, index, action?.orders?.[index]));
	return t`Retry resends this order as you placed it: ${legs.join(", ")}.`;
}

function describeSentLeg(leg: PlanLeg, index: number, sent: CloidOrder | undefined): string {
	const name = getLegName(leg, index);
	const price = sent && "trigger" in sent.t ? String(sent.t.trigger.triggerPx) : leg.price;
	if (leg.role === "scaleLeg" || !price) return name;
	return t`${name} at ${price}`;
}

export function interpretOrderStatuses(statuses: unknown[], legs: PlanLeg[], sizes: string[] = []): OrderResult {
	if (statuses.length === 0) return failed(NO_EXCHANGE_RESPONSE);
	return summarizeLegStates(statuses.map(toLegState), legs, sizes);
}

function summarizeLegStates(states: LegState[], legs: PlanLeg[], sizes: string[]): OrderResult {
	const placed = states.flatMap((state, index) => (state.status === "placed" ? [{ state, index }] : []));
	if (placed.length === states.length) return summarizePlaced(states, legs, sizes);
	const reasons = new Set(states.map((state) => (state.status === "rejected" ? state.reason : undefined)));
	const [onlyReason] = reasons;
	if (reasons.size === 1 && onlyReason) return failed(onlyReason);
	return failed(describeLegStates(states, legs, sizes));
}

function summarizePlaced(states: LegState[], legs: PlanLeg[], sizes: string[]): PlacedResult {
	const result = { ...summarizePlacedOutcomes(states, legs), avgPx: soleFillPrice(states, legs) };
	const shortFills = states.flatMap((state, index) => {
		const short = describeShortFill(getLegName(legs[index] ?? UNNAMED_LEG, index), state, sizes[index]);
		return short ? [short] : [];
	});
	if (shortFills.length === 0) return result;
	const detail = [result.detail, ...shortFills].filter(Boolean).join(". ");
	return { ...result, outcome: "partiallyFilled", detail };
}

function soleFillPrice(states: LegState[], legs: PlanLeg[]): string | undefined {
	const entries = states.filter((_, index) => {
		const role = (legs[index] ?? UNNAMED_LEG).role;
		return role !== "takeProfit" && role !== "stopLoss";
	});
	const [only] = entries;
	if (entries.length !== 1 || only.status !== "placed" || only.outcome !== "filled") return undefined;
	return only.avgPx;
}

function describeShortFill(name: string, state: LegState, size: string | undefined): string | null {
	if (state.status !== "placed" || !state.filledSz || !size) return null;
	const filled = toBig(state.filledSz);
	const ordered = toBig(size);
	if (!filled || !ordered || !filled.lt(ordered)) return null;
	const rest = ordered.minus(filled).toString();
	return t`${name} partially filled: ${state.filledSz} of ${size}, ${rest} not filled`;
}

function summarizePlacedOutcomes(states: LegState[], legs: PlanLeg[]): PlacedResult {
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

function describeLegStates(states: LegState[], legs: PlanLeg[], sizes: string[]): string {
	const placedScaleLegs = states.filter(
		(state, index) => state.status === "placed" && (legs[index] ?? UNNAMED_LEG).role === "scaleLeg",
	).length;
	const sentences = states.flatMap((state, index) => {
		const leg = legs[index] ?? UNNAMED_LEG;
		if (state.status === "placed" && leg.role === "scaleLeg") return [];
		return [describeLegState(leg, index, state, sizes[index])];
	});
	if (placedScaleLegs > 0) sentences.unshift(t`${placedScaleLegs} of ${states.length} legs placed`);
	return sentences.join(". ");
}

function describeLegState(leg: PlanLeg, index: number, state: LegState, size: string | undefined): string {
	const name = getLegName(leg, index);
	switch (state.status) {
		case "placed":
			return describeShortFill(name, state, size) ?? describePlacedLeg(name, leg, state.outcome);
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
			return leg.price ? t`Leg ${legNumber} at ${leg.price}` : t`Leg ${legNumber}`;
		case "order":
			return t`Order`;
	}
}

export function reportSubmit(outcome: SubmitOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return notSent(t`This order is already being sent`);
		case "refused":
			if (outcome.reason === "unreadableRecord") {
				const { slot, raw } = outcome;
				return { ok: false, status: "notSent", error: describeRefusal(outcome), unreadable: { slot, raw } };
			}
			return notSent(describeRefusal(outcome));
		case "failed":
			return notSent(t`Not sent: ${outcome.error}`);
		case "held":
			return reportHeld(outcome);
		case "blocked":
			return reportBlocked(outcome.earlier);
		case "sent":
			return reportSettlement(outcome.settlement);
	}
}

function describeRefusal(refusal: Refused): string {
	switch (refusal.reason) {
		case "storage":
			return t`Can't save order state in this browser. Enable site storage to trade.`;
		case "locks":
			return t`This browser can't keep orders from different tabs apart. Use an up-to-date browser over HTTPS to trade.`;
		case "twapHistory":
			return t`Not sent. Your TWAP history could not be read, so this TWAP could not be tracked. Try again.`;
		case "slotMoved":
			return refusal.to === "pending"
				? t`Not sent. Another order on this market was just sent from another tab. Press again to send a new one.`
				: t`Not sent. Another order on this market was just settled in another tab. Press again to send a new one.`;
		case "unreadableRecord":
			return t`Not sent. Can't read a pending order for this market. It may come from another version of the app and could still execute.`;
	}
}

function reportHeld({ hold }: Held): OrderResult {
	return notSent(
		t`Not sent. Your last order on this market: ${describeHold(hold)}. Sending the same order again could place those legs twice. Check open orders and send only the missing legs as a new order.`,
	);
}

export function describeHeldMarket(hold: Hold): string {
	return t`The same order is held on this market. Last result: ${describeHold(hold)}.`;
}

export function describeHoldDismissal(hold: Hold): string {
	const none = t`none`;
	const placed = legNamesWith(hold, "placed") || none;
	const unknownLegs = legNamesWith(hold, "unknown") || none;
	return t`Known placed: ${placed}. Unknown: ${unknownLegs}. Dismiss the hold? Sending the same order again could place an already placed leg twice.`;
}

function legNamesWith(hold: Hold, fate: LegFate): string {
	return hold.fates
		.flatMap((legFate, index) => (legFate === fate ? [getLegName(hold.legs[index] ?? UNNAMED_LEG, index)] : []))
		.join(", ");
}

export function reportHoldOutcome(outcome: HoldOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return notSent(t`This market is busy. Try again.`);
		case "refused":
			return notSent(describeRefusal(outcome));
		case "missing":
			return unknown(t`That hold changed or was released before you confirmed. Nothing was dismissed.`);
		case "holdDismissed":
			return unknown(
				t`Hold dismissed. Your next order on this market will be sent, even the same one. Check open orders first.`,
			);
	}
}

function describeHold(hold: Hold): string {
	return hold.fates
		.map((fate, index) => {
			const name = getLegName(hold.legs[index] ?? UNNAMED_LEG, index);
			if (fate === "placed") return t`${name} placed`;
			if (fate === "rejected") return t`${name} rejected`;
			return t`${name} not confirmed`;
		})
		.join(", ");
}

function reportBlocked(earlier: Settlement | Live): OrderResult {
	if (earlier.kind === "live") {
		return notSent(
			t`Not sent. An earlier order on this market is not confirmed yet. ${describeRemaining(earlier.remainingMs)} Retry on that order's row sends it again. To send this one, cancel that order and press again.`,
		);
	}
	if (earlier.kind === "pending") {
		return notSent(
			earlier.dismissible
				? t`Not sent. An earlier order on this market is not confirmed yet. Retry, cancel or dismiss it first.`
				: t`Not sent. An earlier order on this market is not confirmed yet. Retry or cancel it first.`,
		);
	}
	const result = reportSettlement(earlier);
	const what = result.ok ? describeOutcome(result.outcome) : withoutFinalPeriod(result.error);
	return notSent(
		t`Not sent. An earlier order on this market was still unconfirmed: ${what}. Press again to send a new order.`,
	);
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

export function reportRequestOutcome(outcome: RequestOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return notSent(t`This order is already being sent`);
		case "refused":
			return notSent(describeRefusal(outcome));
		case "missing":
			return unknown(t`This request was already settled. Check open orders.`);
		case "foreignSigner": {
			const error = canStillExecute(outcome.remainingMs)
				? t`Cannot cancel: another agent key signed this order. ${describeRemaining(outcome.remainingMs)}`
				: t`Cannot cancel: another agent key signed this order.`;
			return unsettled(outcome.request, error, true);
		}
		case "live":
			return unsettled(
				outcome.request,
				t`Not dismissed. ${describeRemaining(outcome.remainingMs)} Retry or cancel it.`,
				false,
			);
		default:
			return reportSettlement(outcome);
	}
}

export function reportUnreadableOutcome(outcome: UnreadableOutcome): OrderResult {
	switch (outcome.kind) {
		case "busy":
			return notSent(t`This market is busy. Try again.`);
		case "refused":
			return notSent(describeRefusal(outcome));
		case "missing":
			return unknown(t`That pending order changed before it was dismissed. Press again to check this market.`);
		case "cleared":
			return unknown(t`Dismissed. The order it could not read may have executed. Check open orders.`);
	}
}

function describeRemaining(remainingMs: number | null): string {
	if (remainingMs === null) return t`It may still execute.`;
	const until = new Date(Date.now() + remainingMs).toLocaleTimeString();
	return t`It can still execute until ${until}.`;
}

export function reportSettlement(settlement: Settlement): OrderResult {
	const { request } = settlement;
	switch (settlement.kind) {
		case "pending":
			return unsettled(
				request,
				settlement.dismissible
					? t`Not confirmed: ${settlement.error}. Retry, cancel or dismiss it.`
					: t`Not confirmed: ${settlement.error}. Retry or cancel it.`,
				settlement.dismissible,
			);
		case "canceled":
			return {
				ok: false,
				status: "canceled",
				error: request.kind === "twap" ? t`Canceled. The TWAP did not start.` : t`Canceled. Nothing was placed.`,
			};
		case "answered":
			return request.kind === "twap"
				? reportTwapReply(settlement.response)
				: reportAnswered(readStatuses(settlement.response), request.legs, orderSizes(request));
		case "consumed":
			return reportLookup(settlement.lookup, request.legs);
		case "expired":
			if (settlement.lookup && foundAny(settlement.lookup)) return reportOrderLookup(settlement.lookup, request.legs);
			if (request.kind === "twap") return failed(t`Not started. The request expired before the exchange took it.`);
			return failed(t`Not placed. The request expired before the exchange took it.`);
		case "dismissed":
			if (settlement.lookup.kind === "order" && foundAny(settlement.lookup)) {
				const found = reportOrderLookup(settlement.lookup, request.legs);
				if (found.ok)
					return {
						...found,
						detail: t`Found by lookup after you dismissed it. The exchange never confirmed the request.`,
					};
				return found;
			}
			if (request.kind === "twap") return unknown(t`Dismissed without confirmation. Check the TWAP tab.`);
			return unknown(t`Dismissed without confirmation. It may have executed. Check open orders.`);
	}
}

function reportLookup(lookup: Lookup, legs: PlanLeg[]): OrderResult {
	return lookup.kind === "twap" ? reportTwapLookup(lookup.matches) : reportOrderLookup(lookup, legs);
}

function reportAnswered(statuses: unknown[], legs: PlanLeg[], sizes: string[]): OrderResult {
	const states = statuses.map(toLegState);
	if (states.length === 0 || states.length >= legs.length || states.every((state) => state.status === "rejected")) {
		return interpretOrderStatuses(statuses, legs, sizes);
	}
	const unanswered = legs.slice(states.length).map((): LegState => ({ status: "missing" }));
	return reportLegStates([...states, ...unanswered], legs, sizes);
}

function orderSizes(request: PendingRequest): string[] {
	const { action } = JSON.parse(request.body) as { action?: { orders?: { s: string }[] } };
	return action?.orders?.map((order) => order.s) ?? [];
}

function reportOrderLookup(lookup: OrderLookup, legs: PlanLeg[]): OrderResult {
	if (!lookup.statuses) {
		return unknown(t`Order sent. Its status could not be read. It will not be sent again. Check open orders.`);
	}
	return reportLegStates(lookup.statuses.map(lookupToLegState), legs);
}

function reportLegStates(states: LegState[], legs: PlanLeg[], sizes: string[] = []): OrderResult {
	const result = summarizeLegStates(states, legs, sizes);
	if (result.ok || !states.some((state) => state.status === "missing")) return result;
	return unknown(t`${result.error}. It will not be sent again. Check open orders.`);
}

function reportTwapLookup(matches: TwapRecord[] | null): OrderResult {
	if (!matches)
		return unknown(t`TWAP sent. Its status could not be read. It will not be sent again. Check the TWAP tab.`);
	if (matches.length === 1) {
		return unknown(
			t`TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.`,
		);
	}
	return unknown(t`TWAP status unknown. It will not be sent again. Check the TWAP tab.`);
}

function foundAny(lookup: OrderLookup): boolean {
	return lookup.statuses?.some((status) => status.status !== "unknownOid") === true;
}

export function describeInspection(inspection: Extract<Inspection, { kind: "inspected" }>): string {
	const { request, lookup, remainingMs } = inspection;
	const found = describeInspectedLookup(lookup, request.legs);
	const when = canStillExecute(remainingMs) ? describeRemaining(remainingMs) : t`It can no longer execute.`;
	return t`The exchange never confirmed this request. ${found} ${when} Dismiss it? Your next order on this market will be sent as a new one.`;
}

function describeInspectedLookup(lookup: Lookup, legs: PlanLeg[]): string {
	if (lookup.kind === "twap") {
		if (!lookup.matches) return t`Your TWAP history could not be read.`;
		if (lookup.matches.length === 0) return t`No matching TWAP is in your history.`;
		if (lookup.matches.length === 1)
			return t`A matching TWAP is in your history, but it can't be confirmed as this one.`;
		return t`Several matching TWAPs are in your history.`;
	}
	if (!lookup.statuses) return t`Its status could not be read.`;
	if (!foundAny(lookup)) return t`A lookup did not find it, which does not prove it never executed.`;
	const result = reportOrderLookup(lookup, legs);
	const what = result.ok ? describeOutcome(result.outcome) : withoutFinalPeriod(result.error);
	return t`A lookup found it: ${what}.`;
}

function withoutFinalPeriod(text: string): string {
	return text.endsWith(".") ? text.slice(0, -1) : text;
}

function reportTwapReply(response: unknown): OrderResult {
	const data = isRecord(response) && isRecord(response.data) ? response.data : null;
	const status = data && isRecord(data.status) ? data.status : null;
	if (status && typeof status.error === "string") return failed(status.error);
	if (status && "running" in status) return { ok: true, outcome: "twapStarted" };
	return failed(NO_EXCHANGE_RESPONSE);
}
