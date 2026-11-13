import type {
	InfoClient,
	IRequestTransport,
	OrderParameters,
	OrderStatusResponse,
	TwapHistoryResponse,
	TwapOrderParameters,
} from "@nktkas/hyperliquid";
import { type ExchangeSingleWalletConfig, noop, order, twapOrder } from "@nktkas/hyperliquid/api/exchange";
import { getWalletAddress } from "@nktkas/hyperliquid/signing";
import Big from "big.js";
import type { CloidOrder, OrderPlan, PlanLeg } from "@/domain/trade/order-intent";
import type { ExchangeClock } from "@/lib/trade/exchange-clock";
import { isRecord, type LegFate, lookupToLegState, readStatuses, toLegFate, toLegState } from "@/lib/trade/leg-state";
import {
	getRequestSlot,
	getUserSlotPrefix,
	type Hold,
	type PendingRequest,
	pendingRecord,
	type RequestLabel,
	type RequestStore,
	type SlotRecord,
	settledRecord,
	UnreadableRecord,
	UnreadableStore,
} from "@/lib/trade/pending-requests";

export const EXPIRY_WINDOW_MS = 30_000;
export const EXPIRY_MARGIN_MS = 5000;
export const IN_FLIGHT_GRACE_MS = 10_000;
export const PARTIAL_HOLD_MS = 5 * 60_000;
const AUTO_RESEND_DELAYS_MS = [1000, 2000, 4000];
const LOOKUP_DELAYS_MS = [500, 1000, 2000];
const READ_TIMEOUT_MS = 3000;

type Reply =
	| { kind: "ok"; response: unknown }
	| { kind: "duplicate" }
	| { kind: "tooLow" }
	| { kind: "expired" }
	| { kind: "rejected"; error: string }
	| { kind: "unreachable"; error: string };

const SETTLING_ERRORS = [
	{ kind: "duplicate", pattern: /^Invalid nonce: duplicate nonce \d+$/ },
	{ kind: "tooLow", pattern: /^Invalid nonce: nonce too low \d+ < \d+$/ },
	{ kind: "expired", pattern: /^Action already expired$/ },
] as const;

export function classifyReply(raw: unknown): Reply {
	if (!isRecord(raw)) return { kind: "rejected", error: "Unexpected exchange reply" };
	if (raw.status === "ok") return { kind: "ok", response: raw.response };
	const error = typeof raw.response === "string" ? raw.response : "Unexpected exchange reply";
	const settling = SETTLING_ERRORS.find(({ pattern }) => pattern.test(error));
	return settling ? { kind: settling.kind } : { kind: "rejected", error };
}

export type TwapRecord = TwapHistoryResponse[number];

export type OrderLookup = { kind: "order"; statuses: OrderStatusResponse[] | null };
export type Lookup = OrderLookup | { kind: "twap"; matches: TwapRecord[] | null };

export type Settlement =
	| { kind: "pending"; request: PendingRequest; error: string; dismissible: boolean }
	| { kind: "answered"; request: PendingRequest; response: unknown }
	| { kind: "consumed"; request: PendingRequest; lookup: Lookup }
	| { kind: "expired"; request: PendingRequest; lookup: OrderLookup | null }
	| { kind: "canceled"; request: PendingRequest }
	| { kind: "dismissed"; request: PendingRequest; lookup: Lookup };

type Busy = { kind: "busy" };
type Missing = { kind: "missing" };

export type Refused =
	| { kind: "refused"; reason: "storage" | "locks" | "twapHistory" }
	| { kind: "refused"; reason: "slotMoved"; to: "pending" | "settled" }
	| { kind: "refused"; reason: "unreadableRecord"; slot: string; raw: string };

export type Held = { kind: "held"; hold: Hold };

type Live = { kind: "live"; request: PendingRequest; remainingMs: number | null };

export type SubmitOutcome =
	| Busy
	| Refused
	| Held
	| { kind: "failed"; error: string }
	| { kind: "blocked"; earlier: Settlement }
	| { kind: "sent"; settlement: Settlement };

export type RequestOutcome =
	| Settlement
	| Busy
	| Missing
	| Refused
	| Live
	| { kind: "foreignSigner"; request: PendingRequest; remainingMs: number | null };

export type Inspection =
	| Settlement
	| Busy
	| Missing
	| Refused
	| Live
	| { kind: "inspected"; request: PendingRequest; lookup: Lookup; remainingMs: number | null };

export type UnreadableOutcome = Busy | Missing | Refused | { kind: "cleared"; slot: string };

type OrderSubmissionParams = Pick<OrderParameters, "builder"> & {
	orders: CloidOrder[];
	grouping: OrderPlan["grouping"];
};

type TwapParams = Pick<TwapOrderParameters, "twap">;

export type Submission =
	| { kind: "order"; params: OrderSubmissionParams; legs: PlanLeg[]; label: RequestLabel }
	| { kind: "twap"; params: TwapParams; coin: string; label: RequestLabel };

export type OrderSubmission = Extract<Submission, { kind: "order" }>;

export interface Signer {
	user: `0x${string}`;
	config: ExchangeSingleWalletConfig;
}

export interface LockManagerLike {
	request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export interface SenderEnv {
	info: () => InfoClient;
	store: RequestStore;
	clock: ExchangeClock;
	locks: () => LockManagerLike | null;
	windowMs?: number;
	graceMs?: number;
	sleep?: (ms: number) => Promise<void>;
}

export function getRequestKey(request: Pick<PendingRequest, "slot" | "nonce">): string {
	return `${request.slot}#${request.nonce}`;
}

type SignedBody = { nonce: number } & Record<string, unknown>;

class HeldBeforeSend extends Error {}

export function createOrderSender(env: SenderEnv) {
	const windowMs = env.windowMs ?? EXPIRY_WINDOW_MS;
	const graceMs = env.graceMs ?? IN_FLIGHT_GRACE_MS;
	const sleep = env.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
	const sending = new Set<string>();
	const revealed = new Set<string>();
	const busyListeners = new Set<() => void>();

	function transport(): IRequestTransport {
		return env.info().config_.transport;
	}

	function network(): string {
		return transport().isTestnet ? "testnet" : "mainnet";
	}

	function emitBusy() {
		for (const listener of busyListeners) listener();
	}

	async function safeguards(): Promise<{ kind: "safe"; locks: LockManagerLike } | Refused> {
		const locks = env.locks();
		if (!locks) return { kind: "refused", reason: "locks" };
		if (!(await env.store.isWritable())) return { kind: "refused", reason: "storage" };
		return { kind: "safe", locks };
	}

	async function exclusive<T>(
		slot: string,
		run: (inSlot: <R>(locked: () => Promise<R>) => Promise<R>) => Promise<T>,
	): Promise<T | Busy | Refused> {
		if (sending.has(slot)) return { kind: "busy" };
		sending.add(slot);
		emitBusy();
		try {
			const guard = await safeguards();
			if (guard.kind === "refused") return guard;
			return await run((locked) => guard.locks.request(`hypeterminal:pending-request:${slot}`, locked));
		} catch (error) {
			if (error instanceof UnreadableStore) return { kind: "refused", reason: "storage" };
			if (error instanceof UnreadableRecord) {
				return { kind: "refused", reason: "unreadableRecord", slot: error.slot, raw: error.raw };
			}
			throw error;
		} finally {
			sending.delete(slot);
			emitBusy();
		}
	}

	async function submit(signer: Signer, submission: Submission): Promise<SubmitOutcome> {
		const asset = Number(submission.kind === "order" ? submission.params.orders[0].a : submission.params.twap.a);
		const slot = getRequestSlot(network(), signer.user, asset);
		return exclusive(slot, async (inSlot) => {
			const seen = stampOf(await env.store.read(slot));
			const claim = await inSlot(() => claimSlot(slot, seen, asset, signer, submission));
			if (claim.kind !== "signed") return claim;
			const settlement = await settle(claim.request, true);
			return { kind: "sent", settlement: await inSlot(() => record(settlement)) };
		});
	}

	async function claimSlot(
		slot: string,
		seen: string,
		asset: number,
		signer: Signer,
		submission: Submission,
	): Promise<{ kind: "signed"; request: PendingRequest } | SubmitOutcome> {
		const current = await env.store.read(slot);
		if (stampOf(current) !== seen) {
			return { kind: "refused", reason: "slotMoved", to: current?.state === "pending" ? "pending" : "settled" };
		}
		if (current?.state === "pending") {
			const earlier = await record(await settle(current.request, false));
			if (!placedNothing(earlier)) {
				if (earlier.kind === "pending") revealed.add(getRequestKey(earlier.request));
				return { kind: "blocked", earlier };
			}
		}
		const holds = await liveHolds((await env.store.read(slot))?.holds ?? [], submission);
		const held = holds.find((hold) => overlaps(hold, submission));
		if (held) return { kind: "held", hold: held };
		try {
			const knownIds = submission.kind === "twap" ? await readTwapIds(signer.user) : [];
			if (!knownIds) return { kind: "refused", reason: "twapHistory" };
			const request = await signRequest(slot, asset, signer, submission, knownIds);
			if (!(await env.store.write(slot, pendingRecord(request, holds)))) return { kind: "refused", reason: "storage" };
			return { kind: "signed", request };
		} catch (error) {
			return { kind: "failed", error: errorMessage(error) };
		}
	}

	async function signRequest(
		slot: string,
		asset: number,
		{ user, config }: Signer,
		submission: Submission,
		knownIds: number[],
	): Promise<PendingRequest> {
		const signedAt = await env.clock.now();
		const expiresAfter = signedAt + windowMs;
		const body = await holdSign(config, (held) =>
			submission.kind === "order"
				? order(held, submission.params, { expiresAfter })
				: twapOrder(held, submission.params, { expiresAfter }),
		);
		return {
			slot,
			kind: submission.kind,
			user: user.toLowerCase() as `0x${string}`,
			signer: (await getWalletAddress(config.wallet)).toLowerCase(),
			asset,
			body: JSON.stringify(body),
			nonce: body.nonce,
			expiresAfter,
			signedAt,
			cloids: submission.kind === "order" ? submission.params.orders.map((leg) => leg.c) : [],
			legs: submission.kind === "order" ? submission.legs : [],
			twap: submission.kind === "twap" ? { coin: submission.coin, knownIds } : null,
			label: submission.label,
		};
	}

	async function settle(request: PendingRequest, firstSend: boolean): Promise<Settlement> {
		const delays = firstSend ? [0, ...AUTO_RESEND_DELAYS_MS] : [0];
		const dismissible = !firstSend && (await isPastExpiry(request));
		let error = "";
		for (const [attempt, delay] of delays.entries()) {
			if (delay > 0) await sleep(delay);
			const reply = await send(JSON.parse(request.body), firstSend && attempt === 0 ? null : READ_TIMEOUT_MS);
			switch (reply.kind) {
				case "ok":
					return { kind: "answered", request, response: reply.response };
				case "duplicate":
				case "tooLow":
					return { kind: "consumed", request, lookup: await lookUp(request, LOOKUP_DELAYS_MS) };
				case "expired":
					return {
						kind: "expired",
						request,
						lookup: request.kind === "order" ? await lookUpOrders(request, [0]) : null,
					};
				default:
					error = reply.error;
			}
		}
		return { kind: "pending", request, error, dismissible };
	}

	async function record(settlement: Settlement): Promise<Settlement> {
		if (settlement.kind === "pending") return settlement;
		const { request } = settlement;
		const current = await env.store.read(request.slot).catch(() => null);
		if (!current) return settlement;
		const holds = withResult(current.holds, settlement, (await exchangeNow()) ?? request.expiresAfter);
		if (current.state === "pending" && current.request.nonce === request.nonce) {
			await env.store.write(request.slot, settledRecord(request.nonce, holds));
		} else if (holds !== current.holds) {
			await env.store.write(request.slot, { ...current, holds });
		}
		return settlement;
	}

	async function exchangeNow(): Promise<number | null> {
		try {
			return await env.clock.now();
		} catch {
			return null;
		}
	}

	async function remainingFor(request: PendingRequest): Promise<number | null> {
		const now = await exchangeNow();
		return now === null ? null : request.expiresAfter + EXPIRY_MARGIN_MS - now;
	}

	async function isPastExpiry(request: PendingRequest): Promise<boolean> {
		return !canStillExecute(await remainingFor(request));
	}

	async function isForeign(signer: Signer, request: PendingRequest): Promise<boolean> {
		return (await getWalletAddress(signer.config.wallet)).toLowerCase() !== request.signer;
	}

	async function liveHolds(holds: Hold[], submission: Submission): Promise<Hold[]> {
		const now = await exchangeNow();
		const checked = await Promise.all(
			holds.map((hold) =>
				windowPassed(hold, now) && overlaps(hold, submission) && hold.fates.includes("unknown")
					? confirmByLookup(hold)
					: hold,
			),
		);
		return checked.filter((hold) => !isReleased(hold, now));
	}

	async function confirmByLookup(hold: Hold): Promise<Hold> {
		const statuses = await readOrderStatuses(hold);
		if (!statuses) return hold;
		return {
			...hold,
			fates: mergeFates(hold.fates, lookupFates({ kind: "order", statuses }, hold.fates.length, "unknown")),
		};
	}

	async function dismissGate(
		request: PendingRequest,
		signer: Signer | null,
	): Promise<{ kind: "allowed"; remainingMs: number | null } | Settlement | Live> {
		const remainingMs = await remainingFor(request);
		if (!canStillExecute(remainingMs)) {
			const resent = await record(await settle(request, false));
			return resent.kind === "pending" ? { kind: "allowed", remainingMs } : resent;
		}
		if (signer && (await isForeign(signer, request))) return { kind: "allowed", remainingMs };
		return { kind: "live", request, remainingMs };
	}

	async function send(body: unknown, timeoutMs: number | null): Promise<Reply> {
		try {
			const signal = timeoutMs === null ? undefined : AbortSignal.timeout(timeoutMs);
			return classifyReply(await transport().request("exchange", body, signal));
		} catch (error) {
			return { kind: "unreachable", error: errorMessage(error) };
		}
	}

	function slotOf(requestKey: string): string {
		return requestKey.slice(0, requestKey.lastIndexOf("#"));
	}

	async function storedRequest(requestKey: string): Promise<PendingRequest | null> {
		const current = await env.store.read(slotOf(requestKey));
		return current?.state === "pending" && getRequestKey(current.request) === requestKey ? current.request : null;
	}

	function retry(requestKey: string): Promise<RequestOutcome> {
		return exclusive(slotOf(requestKey), (inSlot) =>
			inSlot(async (): Promise<RequestOutcome> => {
				const request = await storedRequest(requestKey);
				return request ? record(await settle(request, false)) : { kind: "missing" };
			}),
		);
	}

	function cancel(signer: Signer, requestKey: string): Promise<RequestOutcome> {
		return exclusive(slotOf(requestKey), (inSlot) =>
			inSlot(async (): Promise<RequestOutcome> => {
				const request = await storedRequest(requestKey);
				if (!request) return { kind: "missing" };
				if (await isForeign(signer, request)) {
					return { kind: "foreignSigner", request, remainingMs: await remainingFor(request) };
				}
				const dismissible = await isPastExpiry(request);
				let cancelBody: SignedBody;
				try {
					cancelBody = await holdSign(signer.config, (held) => noop(held, { nonce: request.nonce }));
				} catch (error) {
					return { kind: "pending", request, error: errorMessage(error), dismissible };
				}
				const reply = await send(cancelBody, READ_TIMEOUT_MS);
				if (reply.kind === "ok") return record({ kind: "canceled", request });
				if (reply.kind === "duplicate" || reply.kind === "tooLow") {
					return record({ kind: "consumed", request, lookup: await lookUp(request, LOOKUP_DELAYS_MS) });
				}
				const error = reply.kind === "expired" ? "Action already expired" : reply.error;
				return { kind: "pending", request, error, dismissible };
			}),
		);
	}

	function inspect(requestKey: string, signer: Signer | null = null): Promise<Inspection> {
		return exclusive(slotOf(requestKey), (inSlot) =>
			inSlot(async (): Promise<Inspection> => {
				const request = await storedRequest(requestKey);
				if (!request) return { kind: "missing" };
				const gate = await dismissGate(request, signer);
				if (gate.kind !== "allowed") return gate;
				return { kind: "inspected", request, lookup: await lookUp(request, [0]), remainingMs: gate.remainingMs };
			}),
		);
	}

	function dismiss(requestKey: string, lookup: Lookup, signer: Signer | null = null): Promise<RequestOutcome> {
		return exclusive(slotOf(requestKey), (inSlot) =>
			inSlot(async (): Promise<RequestOutcome> => {
				const request = await storedRequest(requestKey);
				if (!request) return { kind: "missing" };
				const gate = await dismissGate(request, signer);
				if (gate.kind !== "allowed") return gate;
				if (!(await env.store.recordDismissal(requestKey, { request, dismissedAt: Date.now(), lookup }))) {
					return { kind: "refused", reason: "storage" };
				}
				return record({ kind: "dismissed", request, lookup });
			}),
		);
	}

	function dismissUnreadable(slot: string, raw: string): Promise<UnreadableOutcome> {
		return exclusive(slot, (inSlot) =>
			inSlot(async (): Promise<UnreadableOutcome> => {
				if ((await unreadableAt(slot)) !== raw) return { kind: "missing" };
				const dismissedAt = Date.now();
				const saved =
					(await env.store.recordDismissal(`${slot}#unreadable-${dismissedAt}`, { slot, raw, dismissedAt })) &&
					(await env.store.write(slot, settledRecord(null, [])));
				return saved ? { kind: "cleared", slot } : { kind: "refused", reason: "storage" };
			}),
		);
	}

	async function unreadableAt(slot: string): Promise<string | null> {
		try {
			await env.store.read(slot);
			return null;
		} catch (error) {
			if (error instanceof UnreadableRecord) return error.raw;
			throw error;
		}
	}

	function lookUp(request: PendingRequest, delays: number[]): Promise<Lookup> {
		return request.kind === "order" ? lookUpOrders(request, delays) : lookUpTwap(request, delays);
	}

	async function lookUpOrders(request: PendingRequest, delays: number[]): Promise<OrderLookup> {
		const statuses = await poll(
			delays,
			() => readOrderStatuses(request),
			(latest) => latest.every((status) => status.status !== "unknownOid"),
		);
		return { kind: "order", statuses };
	}

	async function lookUpTwap(request: PendingRequest, delays: number[]): Promise<Lookup> {
		const matches = await poll(
			delays,
			async () => {
				const history = await readTwapHistory(request.user);
				return history && findOurTwaps(history, request);
			},
			(latest) => latest.length > 0,
		);
		return { kind: "twap", matches };
	}

	async function readOrderStatuses({
		user,
		cloids,
	}: Pick<PendingRequest, "user" | "cloids">): Promise<OrderStatusResponse[] | null> {
		const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
		try {
			return await Promise.all(cloids.map((cloid) => env.info().orderStatus({ user, oid: cloid }, signal)));
		} catch {
			return null;
		}
	}

	async function readTwapHistory(user: `0x${string}`): Promise<TwapHistoryResponse | null> {
		try {
			return await env.info().twapHistory({ user }, AbortSignal.timeout(READ_TIMEOUT_MS));
		} catch {
			return null;
		}
	}

	async function readTwapIds(user: `0x${string}`): Promise<number[] | null> {
		const history = await readTwapHistory(user);
		return history ? history.flatMap(({ twapId }) => (twapId === undefined ? [] : [twapId])) : null;
	}

	function list(user: string): PendingRequest[] {
		const now = env.clock.estimate();
		const prefix = getUserSlotPrefix(network(), user);
		return env.store
			.pending()
			.filter((request) => request.slot.startsWith(prefix) && !sending.has(request.slot) && isVisible(request, now));
	}

	function isVisible(request: PendingRequest, now: number | null): boolean {
		return now === null || revealed.has(getRequestKey(request)) || now - request.signedAt >= graceMs;
	}

	async function poll<T>(
		delays: number[],
		read: () => Promise<T | null>,
		isDone: (latest: T) => boolean,
	): Promise<T | null> {
		let latest: T | null = null;
		for (const delay of delays) {
			if (delay > 0) await sleep(delay);
			latest = (await read()) ?? latest;
			if (latest && isDone(latest)) return latest;
		}
		return latest;
	}

	return {
		submit,
		retry,
		cancel,
		inspect,
		dismiss,
		dismissUnreadable,
		list,
		subscribe(listener: () => void) {
			let graceTimer: ReturnType<typeof setTimeout> | undefined;
			function recheckAfterGrace() {
				clearTimeout(graceTimer);
				graceTimer = setTimeout(listener, graceMs);
			}
			const unsubscribeStore = env.store.subscribe(() => {
				listener();
				recheckAfterGrace();
			});
			busyListeners.add(listener);
			recheckAfterGrace();
			return () => {
				clearTimeout(graceTimer);
				unsubscribeStore();
				busyListeners.delete(listener);
			};
		},
		warmClock: env.clock.warm,
		isBusy: () => sending.size > 0,
		subscribeBusy(listener: () => void) {
			busyListeners.add(listener);
			return () => busyListeners.delete(listener);
		},
	};
}

export type OrderSender = ReturnType<typeof createOrderSender>;

function stampOf(record: SlotRecord | null): string {
	if (!record) return "empty";
	return record.state === "settled" ? `settled:${record.nonce}` : `pending:${record.request.nonce}`;
}

export function canStillExecute(remainingMs: number | null): boolean {
	return remainingMs === null || remainingMs > 0;
}

export function placedNothing(settlement: Settlement): boolean {
	if (settlement.kind === "canceled") return true;
	if (settlement.kind !== "expired") return false;
	return (
		settlement.lookup === null || settlement.lookup.statuses?.every((status) => status.status === "unknownOid") === true
	);
}

function legFates(settlement: Settlement): LegFate[] | null {
	const { request } = settlement;
	if (request.kind !== "order") return null;
	const legCount = request.cloids.length;
	switch (settlement.kind) {
		case "answered": {
			const fates = readStatuses(settlement.response).map((status) => toLegFate(toLegState(status)));
			if (fates.length > 0 && fates.every((fate) => fate === "rejected")) return everyLeg(legCount, "rejected");
			return Array.from({ length: legCount }, (_, index) => fates[index] ?? "unknown");
		}
		case "consumed":
			return lookupFates(settlement.lookup, legCount, "unknown");
		case "expired":
			return lookupFates(settlement.lookup, legCount, "rejected");
		case "canceled":
			return everyLeg(legCount, "rejected");
		default:
			return null;
	}
}

function lookupFates(lookup: Lookup | null, legCount: number, notFound: LegFate): LegFate[] {
	if (lookup?.kind !== "order" || !lookup.statuses) return everyLeg(legCount, notFound);
	return lookup.statuses.map((status) => {
		const fate = toLegFate(lookupToLegState(status));
		return fate === "unknown" ? notFound : fate;
	});
}

function everyLeg(legCount: number, fate: LegFate): LegFate[] {
	return Array.from({ length: legCount }, () => fate);
}

function withResult(holds: Hold[], settlement: Settlement, since: number): Hold[] {
	const fates = legFates(settlement);
	if (!fates) return holds;
	const { request } = settlement;
	const known = holds.find((hold) => hold.nonce === request.nonce);
	if (!known) return startsHold(fates) ? [...holds, holdOf(request, fates, since)] : holds;
	const merged = mergeFates(known.fates, fates);
	if (merged.every((fate, index) => fate === known.fates[index])) return holds;
	return holds.map((hold) => (hold === known ? { ...hold, fates: merged, since: Math.max(hold.since, since) } : hold));
}

function startsHold(fates: LegFate[]): boolean {
	return fates.length > 1 && !fates.every((fate) => fate === "placed") && !fates.every((fate) => fate === "rejected");
}

function holdOf(request: PendingRequest, fates: LegFate[], since: number): Hold {
	const { action } = JSON.parse(request.body) as { action: OrderSubmissionParams };
	const { user, nonce, cloids, legs } = request;
	return { nonce, user, cloids, legs, buy: action.orders[0].b, fates, since };
}

function mergeFates(known: LegFate[], learned: LegFate[]): LegFate[] {
	return known.map((fate, index) => {
		const next = learned[index] ?? "unknown";
		if (fate === "placed" || next === "placed") return "placed";
		return fate === "unknown" ? next : fate;
	});
}

function windowPassed(hold: Hold, now: number | null): boolean {
	return now !== null && now - hold.since >= PARTIAL_HOLD_MS;
}

function isReleased(hold: Hold, now: number | null): boolean {
	if (hold.fates.every((fate) => fate === "rejected")) return true;
	return windowPassed(hold, now) && !hold.fates.includes("unknown");
}

function overlaps(hold: Hold, submission: Submission): boolean {
	if (submission.kind !== "order" || submission.params.orders[0]?.b !== hold.buy) return false;
	return (
		submission.legs.length === hold.legs.length &&
		submission.legs.every((leg, index) => leg.role === hold.legs[index].role)
	);
}

export function findOurTwaps(history: TwapHistoryResponse, request: PendingRequest): TwapRecord[] {
	if (!request.twap) return [];
	const { coin } = request.twap;
	const known = new Set(request.twap.knownIds);
	const { twap } = (JSON.parse(request.body) as { action: TwapParams }).action;
	const side = twap.b ? "B" : "A";
	return history.filter(
		({ twapId, state }) =>
			twapId !== undefined &&
			!known.has(twapId) &&
			state.coin === coin &&
			state.side === side &&
			Big(state.sz).eq(twap.s) &&
			state.minutes === twap.m &&
			state.reduceOnly === twap.r &&
			state.randomize === twap.t,
	);
}

async function holdSign(
	config: ExchangeSingleWalletConfig,
	sign: (held: ExchangeSingleWalletConfig) => Promise<unknown>,
): Promise<SignedBody> {
	let captured: unknown = null;
	const held: IRequestTransport = {
		isTestnet: config.transport.isTestnet,
		async request(_endpoint, payload) {
			captured = payload;
			throw new HeldBeforeSend();
		},
	};
	try {
		await sign({ ...config, transport: held });
	} catch (error) {
		if (!(error instanceof HeldBeforeSend)) throw error;
	}
	const body: unknown = JSON.parse(JSON.stringify(captured));
	if (!isRecord(body) || typeof body.nonce !== "number") throw new Error("Signing produced no request");
	return body as SignedBody;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
