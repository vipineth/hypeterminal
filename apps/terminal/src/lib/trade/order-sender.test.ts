import { privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportSubmit } from "@/lib/trade/extract-order-status";
import { createExchangeClock, type ExchangeClock } from "@/lib/trade/exchange-clock";
import {
	classifyReply,
	createOrderSender,
	getRequestKey,
	IN_FLIGHT_GRACE_MS,
	type LockManagerLike,
	type OrderSubmission,
	PARTIAL_HOLD_MS,
	type Signer,
	type Submission,
	type SubmitOutcome,
} from "@/lib/trade/order-sender";
import {
	createRequestStore,
	getRequestSlot,
	type ChangeBus,
	type KeyValueStore,
	type RequestStore,
	type SlotRecord,
} from "@/lib/trade/pending-requests";
import {
	comesBackUp,
	createFakeExchange,
	createMemoryLocks,
	createMemoryBus,
	createMemoryKeyValue,
	failingWrites,
	type MemoryKeyValue,
	type FakeExchange,
	goesDownOnFirstSend,
	OTHER_AGENT_KEY,
	TEST_AGENT_KEY,
	TEST_USER,
} from "@/test/fake-exchange";

const SOL = 5;
const SLOT = getRequestSlot("testnet", TEST_USER, SOL);
const REVOKED = "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.";
let cloidSeq = 0;

function nextCloid(): `0x${string}` {
	cloidSeq++;
	return `0xc1${cloidSeq.toString(16).padStart(30, "0")}`;
}

function marketBuy(asset = SOL): Submission {
	return {
		kind: "order",
		params: {
			orders: [
				{ a: asset, b: true, p: "90", s: "1", r: false, t: { limit: { tif: "FrontendMarket" } }, c: nextCloid() },
			],
			grouping: "na",
		},
		legs: [{ role: "order", price: "90" }],
		label: { market: "SOL", side: "buy", size: "1" },
	};
}

function twapBuy(): Submission {
	return {
		kind: "twap",
		params: { twap: { a: SOL, b: true, s: "4", r: false, m: 30, t: false } },
		coin: "SOL",
		label: { market: "SOL", side: "buy", size: "4" },
	};
}

function signerFor(venue: FakeExchange, key = TEST_AGENT_KEY, user: `0x${string}` = TEST_USER): Signer {
	return { user, config: { transport: venue.transport, wallet: privateKeyToAccount(key) } };
}

function openTab(
	venue: FakeExchange,
	storage: KeyValueStore | null,
	locks: LockManagerLike | null,
	options: { clock?: ExchangeClock; sleep?: (ms: number) => Promise<void>; bus?: ChangeBus } = {},
) {
	const store = createRequestStore(() => storage, options.bus);
	const clock = options.clock ?? createExchangeClock(async () => (await venue.info.exchangeStatus()).time, Date.now);
	const sleep = options.sleep ?? (async () => {});
	const sender = createOrderSender({ info: () => venue.info, store, clock, locks: () => locks, sleep });
	return { store, sender, clock };
}

async function pendingNonce(store: RequestStore): Promise<number | null> {
	const current = await store.read(SLOT);
	return current?.state === "pending" ? current.request.nonce : null;
}

function sentRequest(outcome: SubmitOutcome) {
	if (outcome.kind !== "sent") throw new Error(`expected a sent request, got ${outcome.kind}`);
	return outcome.settlement.request;
}

function keyOf(outcome: SubmitOutcome): string {
	return getRequestKey(sentRequest(outcome));
}

function distinctNonces(venue: FakeExchange): number {
	return new Set(venue.orderRequests().map((body) => body.nonce)).size;
}

describe("classifyReply", () => {
	it("settles only on the four replies the probe measured", () => {
		expect(classifyReply({ status: "ok", response: { type: "default" } }).kind).toBe("ok");
		expect(classifyReply({ status: "err", response: "Invalid nonce: duplicate nonce 1794596065043" }).kind).toBe(
			"duplicate",
		);
		expect(
			classifyReply({ status: "err", response: "Invalid nonce: nonce too low 1794596207723 < 1794596207725" }).kind,
		).toBe("tooLow");
		expect(classifyReply({ status: "err", response: "Action already expired" }).kind).toBe("expired");
		expect(classifyReply({ status: "err", response: "Invalid nonce: nonce too high 1794768898840 > 1" }).kind).toBe(
			"rejected",
		);
		expect(
			classifyReply({ status: "err", response: "Order rejected: Invalid nonce: duplicate nonce 1794596065043" }).kind,
		).toBe("rejected");
		expect(
			classifyReply({
				status: "err",
				response: "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.",
			}).kind,
		).toBe("rejected");
	});
});

describe("order sender", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;
	let locks: LockManagerLike;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
		locks = createMemoryLocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("persists the signed request before its first byte reaches the exchange", async () => {
		const { store, sender } = openTab(venue, storage, locks);
		const storedAtArrival: (number | undefined)[] = [];
		venue.state.onArrive = (body) => {
			const stored = storage.items.get(`hypeterminal:pending-request:v2:${SLOT}`) as SlotRecord | undefined;
			storedAtArrival.push(stored?.state === "pending" && stored.request.nonce === body.nonce ? body.nonce : undefined);
		};
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome.kind).toBe("sent");
		expect(storedAtArrival).toEqual([venue.orderRequests()[0].nonce]);
		expect(await pendingNonce(store)).toBeNull();
	});

	it("expires a request 30 s past the exchange clock when the device clock runs 6 minutes behind", async () => {
		venue.state.clockSkewMs = 6 * 60 * 1000;
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), marketBuy());
		const [body] = venue.orderRequests();
		expect(body.expiresAfter).toBeGreaterThan(venue.exchangeNow() + 29_000);
		expect(body.expiresAfter).toBeLessThanOrEqual(venue.exchangeNow() + 30_000);
		expect(venue.state.placedLegs).toBe(1);
	});

	it("expires a request 30 s past the exchange clock when the device clock runs 6 minutes ahead", async () => {
		venue.state.clockSkewMs = -6 * 60 * 1000;
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), marketBuy());
		expect(venue.orderRequests()[0].expiresAfter).toBeLessThanOrEqual(venue.exchangeNow() + 30_000);
	});

	it("sends nothing when the exchange clock cannot be read", async () => {
		venue.state.infoDown = true;
		const { store, sender } = openTab(venue, storage, locks);
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome).toEqual({ kind: "failed", error: "Failed to fetch" });
		expect(venue.exchangeRequests).toEqual([]);
		expect(await store.read(SLOT)).toBeNull();
	});

	it("resends the stored body byte for byte after a lost reply, and one order executes", async () => {
		venue.nextExchangeRequests("noReply");
		const { store, sender } = openTab(venue, storage, locks);
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome).toMatchObject({
			kind: "sent",
			settlement: { kind: "consumed", lookup: { kind: "order", statuses: [{ order: { status: "filled" } }] } },
		});
		expect(venue.exchangeRequests).toHaveLength(2);
		expect(new Set(venue.exchangeRequests).size).toBe(1);
		expect(venue.state.placedLegs).toBe(1);
		expect(await pendingNonce(store)).toBeNull();
	});

	it("lets an original still in transit land at most once beside its resend", async () => {
		venue.nextExchangeRequests("inTransit");
		const { sender } = openTab(venue, storage, locks);
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		expect(venue.deliverInTransit()).toEqual([
			{ status: "err", response: `Invalid nonce: duplicate nonce ${venue.orderRequests()[0].nonce}` },
		]);
		expect(venue.state.placedLegs).toBe(1);
	});

	it("resends a request left unconfirmed before a reload instead of signing a new one", async () => {
		goesDownOnFirstSend(venue);
		const before = openTab(venue, storage, locks);
		const first = await before.sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		comesBackUp(venue);
		const afterReload = openTab(venue, storage, locks);
		const second = await afterReload.sender.submit(signerFor(venue), marketBuy());
		expect(second).toMatchObject({ kind: "blocked", earlier: { kind: "consumed" } });
		expect(venue.state.placedLegs).toBe(1);
		expect(distinctNonces(venue)).toBe(1);
	});

	it("lists a user's unconfirmed request in a tab opened later, so its toast can offer Retry and Cancel", async () => {
		goesDownOnFirstSend(venue);
		const first = openTab(venue, storage, locks);
		const outcome = await first.sender.submit(signerFor(venue), marketBuy());
		const later = openTab(venue, storage, locks);
		await later.store.refresh();
		vi.setSystemTime(Date.now() + IN_FLIGHT_GRACE_MS);
		expect(later.sender.list(TEST_USER).map((request) => request.nonce)).toEqual([sentRequest(outcome).nonce]);
		expect(later.sender.list("0x0000000000000000000000000000000000000002")).toEqual([]);
	});

	it("leaves a request out of its tab's list while that tab is still sending it", async () => {
		const { sender } = openTab(venue, storage, locks);
		const listedDuringSend: number[] = [];
		venue.state.onArrive = () => listedDuringSend.push(sender.list(TEST_USER).length);
		venue.nextExchangeRequests("noReply");
		await sender.submit(signerFor(venue), marketBuy());
		expect(listedDuringSend).toEqual([0, 0]);
	});

	it("sends one signed body when two tabs press at the same moment", async () => {
		const tabA = openTab(venue, storage, locks);
		const tabB = openTab(venue, storage, locks);
		const outcomes = await Promise.all([
			tabA.sender.submit(signerFor(venue), marketBuy()),
			tabB.sender.submit(signerFor(venue), marketBuy()),
		]);
		expect(outcomes.map((outcome) => outcome.kind).sort()).toEqual(["refused", "sent"]);
		expect(venue.state.placedLegs).toBe(1);
		expect(distinctNonces(venue)).toBe(1);
	});

	it("refuses a second press on the same market in the same tab while the first is in flight", async () => {
		const { sender } = openTab(venue, storage, locks);
		const outcomes = await Promise.all([
			sender.submit(signerFor(venue), marketBuy()),
			sender.submit(signerFor(venue), marketBuy()),
		]);
		expect(outcomes.map((outcome) => outcome.kind)).toEqual(["sent", "busy"]);
		expect(venue.exchangeRequests).toHaveLength(1);
	});

	it("keeps one user's unconfirmed request out of another user's way on the same market", async () => {
		goesDownOnFirstSend(venue);
		const { store, sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), marketBuy());
		comesBackUp(venue);
		const otherUser = "0x0000000000000000000000000000000000000002";
		const outcome = await sender.submit(signerFor(venue, TEST_AGENT_KEY, otherUser), marketBuy());
		expect(outcome).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		expect(await pendingNonce(store)).not.toBeNull();
		expect(distinctNonces(venue)).toBe(2);
	});

	it("settles an expired request with nothing placed and signs the next press in the same call", async () => {
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		vi.setSystemTime(Date.now() + 31_000);
		const second = await sender.submit(signerFor(venue), marketBuy());
		expect(second).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		expect(venue.state.placedLegs).toBe(1);
		expect(distinctNonces(venue)).toBe(2);
	});

	it("retries the stored body from any number of presses and places one order", async () => {
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		const key = `${first.settlement.request.slot}#${first.settlement.request.nonce}`;
		const retried = await sender.retry(key);
		const again = await sender.retry(key);
		venue.deliverInTransit();
		expect(retried.kind).toBe("answered");
		expect(again.kind).toBe("missing");
		expect(venue.state.placedLegs).toBe(1);
		expect(distinctNonces(venue)).toBe(1);
	});

	it("cancels a request still in transit with a noop at its nonce, so the original never executes", async () => {
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		const { request } = first.settlement;
		const canceled = await sender.cancel(signerFor(venue), `${request.slot}#${request.nonce}`);
		expect(canceled.kind).toBe("canceled");
		expect(venue.sentBodies().at(-1)).toMatchObject({ action: { type: "noop" }, nonce: request.nonce });
		expect(venue.deliverInTransit()).toEqual([
			{ status: "err", response: `Invalid nonce: duplicate nonce ${request.nonce}` },
		]);
		expect(venue.state.placedLegs).toBe(0);
		expect(await pendingNonce(store)).toBeNull();
	});

	it("refuses to cancel a request another agent key signed", async () => {
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		const { request } = first.settlement;
		const canceled = await sender.cancel(signerFor(venue, OTHER_AGENT_KEY), `${request.slot}#${request.nonce}`);
		expect(canceled.kind).toBe("foreignSigner");
		expect(await pendingNonce(store)).toBe(request.nonce);
	});

	it("settles a nonce the signer has moved past as too low and looks the order up", async () => {
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		venue.state.nonceFloor = Number.MAX_SAFE_INTEGER - 1;
		const { request } = first.settlement;
		const retried = await sender.retry(`${request.slot}#${request.nonce}`);
		expect(retried).toMatchObject({
			kind: "consumed",
			lookup: { kind: "order", statuses: [{ status: "unknownOid" }] },
		});
		expect(venue.state.placedLegs).toBe(0);
	});

	it("keeps a request the exchange rejects without consuming its nonce pending, however long it takes", async () => {
		venue.state.rejectWith = REVOKED;
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		for (const later of [31_000, 36_000, 60 * 60 * 1000]) {
			vi.setSystemTime(Date.now() + later);
			expect(await sender.retry(keyOf(first))).toMatchObject({ kind: "pending", error: REVOKED });
		}
		expect(await pendingNonce(store)).toBe(sentRequest(first).nonce);
	});

	it("blocks a new press when an order landed before its agent key was revoked", async () => {
		goesDownOnFirstSend(venue);
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		comesBackUp(venue);
		venue.state.rejectWith = REVOKED;
		vi.setSystemTime(Date.now() + 36_000);
		const second = await sender.submit(signerFor(venue, OTHER_AGENT_KEY), marketBuy());
		expect(second).toMatchObject({ kind: "blocked", earlier: { kind: "pending", error: REVOKED } });
		expect(venue.state.placedLegs).toBe(1);
	});

	it("attributes only a TWAP that appeared after its snapshot, on its coin, with its params", async () => {
		const sameParams = { side: "B", sz: "4", minutes: 30, reduceOnly: false, randomize: false };
		const earlier = { executedSz: "0.0", executedNtl: "0.0", timestamp: Date.now() - 4 * 60 * 1000 };
		venue.seedTwap({
			time: 0,
			state: { coin: "SOL", ...sameParams, ...earlier },
			status: { status: "activated" },
			twapId: 1,
		});
		venue.state.onArrive = () => {
			venue.seedTwap({
				time: 0,
				state: { coin: "ETH", ...sameParams, ...earlier, timestamp: Date.now() },
				status: { status: "error", description: "Insufficient margin" },
				twapId: 2,
			});
			venue.state.onArrive = null;
		};
		venue.nextExchangeRequests("noReply");
		const { sender } = openTab(venue, storage, locks);
		const outcome = await sender.submit(signerFor(venue), twapBuy());
		const started = venue.twapHistory.find((record) => record.state.coin === "SOL" && record.twapId !== 1);
		expect(outcome).toMatchObject({
			kind: "sent",
			settlement: { kind: "consumed", lookup: { kind: "twap", matches: [{ twapId: started?.twapId }] } },
		});
		expect(venue.state.startedTwaps).toBe(1);
	});

	it("starts no TWAP when its request expires in transit", async () => {
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), twapBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		vi.setSystemTime(Date.now() + 31_000);
		const { request } = first.settlement;
		const retried = await sender.retry(`${request.slot}#${request.nonce}`);
		venue.deliverInTransit();
		expect(retried.kind).toBe("expired");
		expect(venue.state.startedTwaps).toBe(0);
	});
});

function fullStorage(): KeyValueStore {
	return failingWrites(createMemoryKeyValue());
}

function storageFullFor(prefix: string): KeyValueStore {
	return failingWrites(createMemoryKeyValue(), prefix);
}

function gate(): [Promise<void>, () => void] {
	let release = () => {};
	const opened = new Promise<void>((resolve) => {
		release = resolve;
	});
	return [opened, release];
}

function pausedAtFirstSettle(base: KeyValueStore, until: Promise<void>): KeyValueStore {
	let paused = false;
	return {
		get: (key) => base.get(key),
		keys: () => base.keys(),
		async set(key, value) {
			if (!paused && (value as SlotRecord | null)?.state === "settled") {
				paused = true;
				await until;
			}
			await base.set(key, value);
		},
	};
}

function scale(prices: string[], { buy = true, asset = SOL } = {}): OrderSubmission {
	return {
		kind: "order",
		params: {
			orders: prices.map((p) => ({
				a: asset,
				b: buy,
				p,
				s: "1",
				r: false,
				t: { limit: { tif: "FrontendMarket" as const } },
				c: nextCloid(),
			})),
			grouping: "na",
		},
		legs: prices.map((price) => ({ role: prices.length > 1 ? ("scaleLeg" as const) : ("order" as const), price })),
		label: { market: "SOL", side: buy ? "buy" : "sell", size: String(prices.length) },
	};
}

function entryWithTakeProfit(takeProfit: string): OrderSubmission {
	return {
		kind: "order",
		params: {
			orders: [
				{ a: SOL, b: true, p: "90", s: "1", r: false, t: { limit: { tif: "FrontendMarket" } }, c: nextCloid() },
				{
					a: SOL,
					b: false,
					p: takeProfit,
					s: "1",
					r: true,
					t: { trigger: { isMarket: true, triggerPx: takeProfit, tpsl: "tp" } },
					c: nextCloid(),
				},
			],
			grouping: "normalTpsl",
		},
		legs: [
			{ role: "entry", price: "90" },
			{ role: "takeProfit", price: takeProfit },
		],
		label: { market: "SOL", side: "buy", size: "1" },
	};
}

function sentPrices(venue: FakeExchange): string[] {
	return venue.orderRequests().flatMap((body) => (body.action.orders as { p: string }[]).map((leg) => leg.p));
}

describe("order sender in a browser that cannot keep its records", () => {
	let venue: FakeExchange;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("sends nothing without site storage, so a reload cannot sign a second order", async () => {
		const locks = createMemoryLocks();
		venue.nextExchangeRequests("noReply", "lost", "lost", "lost");
		const first = await openTab(venue, null, locks).sender.submit(signerFor(venue), marketBuy());
		const afterReload = await openTab(venue, null, locks).sender.submit(signerFor(venue), marketBuy());
		expect(first).toEqual({ kind: "refused", reason: "storage" });
		expect(afterReload).toEqual({ kind: "refused", reason: "storage" });
		expect(reportSubmit(first)).toEqual({
			ok: false,
			status: "notSent",
			error: "Can't save order state in this browser. Enable site storage to trade.",
		});
		expect(venue.exchangeRequests).toEqual([]);
	});

	it("sends nothing when storage is full, from this tab, a reload or a second tab", async () => {
		const storage = fullStorage();
		const locks = createMemoryLocks();
		venue.nextExchangeRequests("noReply", "lost", "lost", "lost");
		const tabA = openTab(venue, storage, locks);
		const tabB = openTab(venue, storage, locks);
		expect(await tabA.sender.submit(signerFor(venue), marketBuy())).toEqual({ kind: "refused", reason: "storage" });
		expect(await tabB.sender.submit(signerFor(venue), marketBuy())).toEqual({ kind: "refused", reason: "storage" });
		expect(venue.state.placedLegs).toBe(0);
	});

	it("refuses before it signs, so no wallet is asked to sign an order that cannot be sent", async () => {
		const clock = { now: vi.fn(async () => Date.now()), warm() {} };
		const { sender } = openTab(venue, fullStorage(), createMemoryLocks(), { clock });
		expect(await sender.submit(signerFor(venue), marketBuy())).toEqual({ kind: "refused", reason: "storage" });
		expect(clock.now).not.toHaveBeenCalled();
	});

	it("sends nothing when the signed request itself cannot be saved", async () => {
		const storage = storageFullFor("hypeterminal:pending-request:v2:");
		const { sender } = openTab(venue, storage, createMemoryLocks());
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome).toEqual({ kind: "refused", reason: "storage" });
		expect(venue.exchangeRequests).toEqual([]);
	});

	it("sends nothing without Web Locks, so two tabs cannot both sign", async () => {
		const storage = createMemoryKeyValue();
		const tabA = openTab(venue, storage, null);
		const tabB = openTab(venue, storage, null);
		const outcomes = await Promise.all([
			tabA.sender.submit(signerFor(venue), marketBuy()),
			tabB.sender.submit(signerFor(venue), marketBuy()),
		]);
		expect(outcomes).toEqual([
			{ kind: "refused", reason: "locks" },
			{ kind: "refused", reason: "locks" },
		]);
		expect(reportSubmit(outcomes[0])).toMatchObject({ status: "notSent", error: expect.stringMatching(/HTTPS/) });
		expect(venue.exchangeRequests).toEqual([]);
		expect(await tabA.store.read(SLOT)).toBeNull();
	});
});

describe("order sender with a press that waited on the slot", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("asks for a second press when another tab's order went through while this press waited", async () => {
		const locks = createMemoryLocks();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const slowLocks: LockManagerLike = {
			async request(name, callback) {
				await gate;
				return locks.request(name, callback);
			},
		};
		const tabA = openTab(venue, storage, locks);
		const tabB = openTab(venue, storage, slowLocks);
		const pressA = tabA.sender.submit(signerFor(venue), marketBuy());
		const pressB = tabB.sender.submit(signerFor(venue), marketBuy());
		expect(await pressA).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		release();
		const outcome = await pressB;
		expect(outcome).toEqual({ kind: "refused", reason: "slotMoved", to: "settled" });
		expect(reportSubmit(outcome)).toEqual({
			ok: false,
			status: "notSent",
			error: "Not sent. Another order on this market was just settled in another tab. Press again to send a new one.",
		});
		expect(venue.state.placedLegs).toBe(1);
	});
});

describe("order sender settling only on the exchange's reply", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;
	let locks: LockManagerLike;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
		locks = createMemoryLocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("keeps an unconfirmed order pending when the device clock runs ahead, so its late original executes once", async () => {
		let ahead = 0;
		const clock: ExchangeClock = { now: async () => Date.now() + ahead, warm() {} };
		const { sender } = openTab(venue, storage, locks, { clock });
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const first = await sender.submit(signerFor(venue), marketBuy());
		ahead = 36_000;
		venue.state.rejectWith = "Temporary pre-nonce rejection";
		expect(await sender.retry(keyOf(first))).toMatchObject({ kind: "pending" });
		venue.state.rejectWith = null;
		const second = await sender.submit(signerFor(venue), marketBuy());
		venue.deliverInTransit();
		expect(second).toMatchObject({ kind: "blocked", earlier: { kind: "answered" } });
		expect(venue.state.placedLegs).toBe(1);
	});

	it("blocks a press after expiry when the original filled but its agent was replaced and lookups lag", async () => {
		const { sender } = openTab(venue, storage, locks);
		venue.nextExchangeRequests("noReply", "lost", "lost", "lost");
		const first = await sender.submit(signerFor(venue), marketBuy());
		const original = sentRequest(first);
		vi.setSystemTime(Date.now() + 36_000);
		venue.state.lookupLag = 3;
		venue.state.onArrive = (body) => {
			venue.state.rejectWith = body.nonce === original.nonce ? REVOKED : null;
		};
		const second = await sender.submit(signerFor(venue, OTHER_AGENT_KEY), marketBuy());
		expect(second).toMatchObject({ kind: "blocked", earlier: { kind: "pending" } });
		expect(reportSubmit(second)).toEqual({
			ok: false,
			status: "notSent",
			error: "Not sent. An earlier order on this market is not confirmed yet. Retry, cancel or dismiss it first.",
		});
		expect(venue.state.placedLegs).toBe(1);
	});

	it("reports an order whose nonce a later resend found consumed as unknown, not as an earlier attempt's rejection", async () => {
		venue.nextExchangeRequests("deliver", "noReply");
		venue.state.lookupLag = 10;
		let arrivals = 0;
		venue.state.onArrive = () => {
			arrivals++;
			venue.state.rejectWith = arrivals === 1 ? REVOKED : null;
		};
		const outcome = await openTab(venue, storage, locks).sender.submit(signerFor(venue), marketBuy());
		expect(JSON.stringify(reportSubmit(outcome))).not.toContain("does not exist");
		expect(outcome).toMatchObject({ kind: "sent", settlement: { kind: "consumed" } });
		expect(reportSubmit(outcome)).toEqual({
			ok: false,
			status: "unknown",
			error: "Order not found on the exchange. It will not be sent again. Check open orders.",
		});
		expect(venue.state.placedLegs).toBe(1);
	});

	it("never reports a superseded rejection once a later resend lands the order", async () => {
		venue.state.rejectWith = "Too many requests";
		venue.nextExchangeRequests("deliver", "noReply", "deliver");
		let sends = 0;
		venue.state.onSend = () => {
			sends++;
			if (sends === 2) venue.state.rejectWith = null;
		};
		venue.state.lookupLag = 3;
		const outcome = await openTab(venue, storage, locks).sender.submit(signerFor(venue), marketBuy());
		expect(venue.state.placedLegs).toBe(1);
		const report = reportSubmit(outcome);
		expect(JSON.stringify(report)).not.toContain("Too many requests");
		expect(report).toMatchObject({ ok: false, status: "unknown" });
	});

	it("unblocks a market only through a confirmed dismissal, which it records", async () => {
		const { store, sender } = openTab(venue, storage, locks);
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const first = await sender.submit(signerFor(venue), marketBuy());
		vi.setSystemTime(Date.now() + 60 * 60 * 1000);
		venue.nextExchangeRequests("lost", "lost", "lost");
		expect((await sender.retry(keyOf(first))).kind).toBe("pending");
		expect((await sender.cancel(signerFor(venue, OTHER_AGENT_KEY), keyOf(first))).kind).toBe("foreignSigner");
		expect(await sender.submit(signerFor(venue, OTHER_AGENT_KEY), marketBuy())).toMatchObject({
			kind: "blocked",
			earlier: { kind: "pending" },
		});
		const inspection = await sender.inspect(keyOf(first));
		expect(inspection).toMatchObject({
			kind: "inspected",
			canStillExecute: false,
			lookup: { kind: "order", statuses: [{ status: "unknownOid" }] },
		});
		expect(await pendingNonce(store)).toBe(sentRequest(first).nonce);
		if (inspection.kind !== "inspected") throw new Error("expected an inspection");
		const dismissedAt = Date.now();
		const dismissed = await sender.dismiss(keyOf(first), inspection.lookup);
		expect(dismissed).toMatchObject({ kind: "dismissed" });
		const next = await sender.submit(signerFor(venue, OTHER_AGENT_KEY), marketBuy());
		expect(next).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		expect(venue.state.placedLegs).toBe(1);
		expect(await pendingNonce(store)).toBeNull();
		expect(await storage.get(`hypeterminal:dismissed-request:v1:${keyOf(first)}`)).toMatchObject({
			request: { nonce: sentRequest(first).nonce },
			dismissedAt,
			lookup: { kind: "order", statuses: [{ status: "unknownOid" }] },
		});
	});

	it("keeps a request pending when its lookup finds nothing", async () => {
		venue.state.exchangeDown = true;
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		vi.setSystemTime(Date.now() + 60_000);
		expect(await sender.inspect(keyOf(first))).toMatchObject({
			lookup: { statuses: [{ status: "unknownOid" }] },
		});
		expect(await pendingNonce(store)).toBe(sentRequest(first).nonce);
		expect(await sender.submit(signerFor(venue), marketBuy())).toMatchObject({ kind: "blocked" });
	});

	it("asks for a second press when an expired request's lookup cannot be read", async () => {
		const { sender } = openTab(venue, storage, locks);
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await sender.submit(signerFor(venue), marketBuy());
		vi.setSystemTime(Date.now() + 31_000);
		venue.state.infoDown = true;
		const blocked = await sender.submit(signerFor(venue), marketBuy());
		expect(blocked).toMatchObject({ kind: "blocked", earlier: { kind: "expired", lookup: { statuses: null } } });
		expect(distinctNonces(venue)).toBe(1);
		venue.state.infoDown = false;
		expect(await sender.submit(signerFor(venue), marketBuy())).toMatchObject({ kind: "sent" });
		expect(venue.state.placedLegs).toBe(1);
	});

	it("keeps a request pending when its Cancel is refused for a reason that proves nothing", async () => {
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		venue.state.rejectWith = REVOKED;
		const canceled = await sender.cancel(signerFor(venue), keyOf(first));
		expect(canceled).toMatchObject({ kind: "pending", error: REVOKED });
		expect(await pendingNonce(store)).toBe(sentRequest(first).nonce);
		venue.state.rejectWith = null;
		venue.deliverInTransit();
		expect(venue.state.placedLegs).toBe(1);
	});

	it("never lets one tab's late settlement overwrite another tab's newer request", async () => {
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const tabA = openTab(venue, storage, locks, { sleep: () => gate });
		const tabB = openTab(venue, storage, locks);
		venue.nextExchangeRequests("lost");
		const pressA = tabA.sender.submit(signerFor(venue), marketBuy());
		await vi.waitFor(() => expect(venue.exchangeRequests).toHaveLength(1));
		vi.setSystemTime(Date.now() + 31_000);
		venue.nextExchangeRequests("deliver", "lost", "lost", "lost", "lost");
		const pressB = await tabB.sender.submit(signerFor(venue), marketBuy());
		const requestB = sentRequest(pressB);
		expect(await pendingNonce(tabB.store)).toBe(requestB.nonce);
		release();
		expect(await pressA).toMatchObject({ kind: "sent", settlement: { kind: "consumed" } });
		expect(await pendingNonce(tabA.store)).toBe(requestB.nonce);
	});

	it("never lets a settlement that read the slot before another tab's write land on top of it", async () => {
		const [aWrite, releaseAWrite] = gate();
		const [bWrite, releaseBWrite] = gate();
		const [aSleep, releaseASleep] = gate();
		const tabA = openTab(venue, pausedAtFirstSettle(storage, aWrite), locks, { sleep: () => aSleep });
		const tabB = openTab(venue, pausedAtFirstSettle(storage, bWrite), locks);
		venue.nextExchangeRequests("lost", "deliver", "deliver", "lost", "lost", "lost", "lost");
		const pressA = tabA.sender.submit(signerFor(venue), marketBuy());
		await vi.waitFor(() => expect(venue.exchangeRequests).toHaveLength(1));
		vi.setSystemTime(Date.now() + 31_000);
		const pressB = tabB.sender.submit(signerFor(venue), marketBuy());
		await vi.waitFor(() => expect(venue.exchangeRequests).toHaveLength(2));
		releaseASleep();
		await vi.waitFor(() => expect(venue.exchangeRequests).toHaveLength(3));
		await new Promise((resolve) => setTimeout(resolve, 20));
		releaseBWrite();
		const requestB = sentRequest(await pressB);
		releaseAWrite();
		expect(await pressA).toMatchObject({ kind: "sent", settlement: { kind: "consumed" } });
		expect(await pendingNonce(tabB.store)).toBe(requestB.nonce);
	});

	it("never acts on a newer request from a row whose own request has settled", async () => {
		const { store, sender } = openTab(venue, storage, locks);
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const first = await sender.submit(signerFor(venue), marketBuy());
		vi.setSystemTime(Date.now() + 31_000);
		venue.nextExchangeRequests("deliver", "lost", "lost", "lost", "lost");
		const second = await sender.submit(signerFor(venue), marketBuy());
		const sentBefore = venue.exchangeRequests.length;
		expect(await sender.retry(keyOf(first))).toEqual({ kind: "missing" });
		expect(await sender.cancel(signerFor(venue), keyOf(first))).toEqual({ kind: "missing" });
		expect(venue.exchangeRequests).toHaveLength(sentBefore);
		expect(await pendingNonce(store)).toBe(sentRequest(second).nonce);
	});
});

describe("order sender with twaps", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;
	let locks: LockManagerLike;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
		locks = createMemoryLocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("signs no twap while its history snapshot cannot be read", async () => {
		const tab = openTab(venue, storage, locks);
		await tab.clock.now();
		venue.state.infoDown = true;
		const outcome = await tab.sender.submit(signerFor(venue), twapBuy());
		expect(outcome).toEqual({ kind: "refused", reason: "twapHistory" });
		expect(venue.exchangeRequests).toEqual([]);
		expect(venue.state.startedTwaps).toBe(0);
	});

	it("blocks a second twap after expiry when the first landed and its agent was replaced", async () => {
		goesDownOnFirstSend(venue);
		const { sender } = openTab(venue, storage, locks);
		expect(await sender.submit(signerFor(venue), twapBuy())).toMatchObject({ settlement: { kind: "pending" } });
		comesBackUp(venue);
		venue.state.rejectWith = REVOKED;
		vi.setSystemTime(Date.now() + 36_000);
		const second = await sender.submit(signerFor(venue, OTHER_AGENT_KEY), twapBuy());
		expect(second).toMatchObject({ kind: "blocked", earlier: { kind: "pending" } });
		expect(venue.state.startedTwaps).toBe(1);
	});

	it("never reports another request's matching twap as this one started", async () => {
		venue.state.twapError = "Insufficient margin";
		venue.nextExchangeRequests("noReply");
		venue.state.onArrive = () => {
			venue.seedTwap({
				time: 0,
				twapId: 123,
				state: {
					coin: "SOL",
					side: "B",
					sz: "4",
					minutes: 30,
					reduceOnly: false,
					randomize: false,
					timestamp: Date.now(),
					executedSz: "0",
					executedNtl: "0",
				},
				status: { status: "activated" },
			});
			venue.state.onArrive = null;
		};
		const outcome = await openTab(venue, storage, locks).sender.submit(signerFor(venue), twapBuy());
		expect(reportSubmit(outcome).ok).toBe(false);
		expect(outcome).toMatchObject({ settlement: { kind: "consumed", lookup: { matches: [{ twapId: 123 }] } } });
		expect(reportSubmit(outcome)).toEqual({
			ok: false,
			status: "unknown",
			error:
				"TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.",
		});
		expect(venue.state.startedTwaps).toBe(0);
	});
});

describe("order sender after a partial result", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;
	let locks: LockManagerLike;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
		locks = createMemoryLocks();
		venue.state.legOutcome = (order) =>
			order.p === "95" || order.p === "97" ? { status: { error: "bad price" }, lookup: "rejected" } : undefined;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function heldOffer(outcome: SubmitOutcome): OrderSubmission {
		if (outcome.kind !== "held" || !outcome.offer)
			throw new Error(`expected a held press with an offer, got ${outcome.kind}`);
		return outcome.offer;
	}

	it("holds a corrected resubmit that would place the filled leg again, and offers only the rejected leg", async () => {
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), scale(["90", "95"]));
		const corrected = await sender.submit(signerFor(venue), scale(["90", "96"]));
		expect(sentPrices(venue).filter((price) => price === "90")).toHaveLength(1);
		expect(reportSubmit(first)).toEqual({
			ok: false,
			status: "failed",
			error: "1 of 2 legs placed. Leg 2 at 95 rejected: bad price",
		});
		expect(corrected).toMatchObject({ kind: "held", partial: { fates: ["placed", "rejected"] } });
		expect(heldOffer(corrected).params.orders.map((leg) => leg.p)).toEqual(["96"]);
		expect(reportSubmit(corrected)).toMatchObject({
			status: "notSent",
			error:
				"Not sent. Your last order on this market partly went through: Leg 1 placed, Leg 2 rejected. Sending it again would place the same legs twice.",
		});
		expect(venue.state.placedLegs).toBe(1);
		expect(venue.orderRequests()).toHaveLength(1);
	});

	it("sends only the rejected leg at its corrected price, so the filled leg is placed once", async () => {
		const { store, sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), scale(["90", "95"]));
		const offer = heldOffer(await sender.submit(signerFor(venue), scale(["90", "96"])));
		const sent = await sender.submit(signerFor(venue), offer);
		expect(reportSubmit(sent)).toEqual({ ok: true, outcome: "filled" });
		expect(sentPrices(venue)).toEqual(["90", "95", "96"]);
		expect(venue.state.placedLegs).toBe(2);
		expect(await store.read(SLOT)).toMatchObject({ state: "settled", partial: null });
		expect(await sender.submit(signerFor(venue), offer)).toEqual({ kind: "refused", reason: "offerStale" });
	});

	it("keeps holding while a resent leg is rejected again, and then offers only that leg", async () => {
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), scale(["90", "95", "97"]));
		const offer = heldOffer(await sender.submit(signerFor(venue), scale(["90", "96", "97"])));
		expect(offer.params.orders.map((leg) => leg.p)).toEqual(["96", "97"]);
		await sender.submit(signerFor(venue), offer);
		const again = await sender.submit(signerFor(venue), scale(["90", "96", "98"]));
		expect(again).toMatchObject({ kind: "held", partial: { fates: ["placed", "placed", "rejected"] } });
		expect(heldOffer(again).params.orders.map((leg) => leg.p)).toEqual(["98"]);
	});

	it("holds an entry whose take profit was rejected without offering a lone take profit", async () => {
		venue.state.legOutcome = (order) =>
			"trigger" in order.t ? { status: { error: "Invalid TP/SL price. asset=5" }, lookup: "rejected" } : undefined;
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), entryWithTakeProfit("100"));
		const corrected = await sender.submit(signerFor(venue), entryWithTakeProfit("101"));
		expect(corrected).toMatchObject({ kind: "held", offer: null });
		expect(venue.state.placedLegs).toBe(1);
	});

	it("stops holding five minutes after the partial result", async () => {
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), scale(["90", "95"]));
		vi.setSystemTime(Date.now() + PARTIAL_HOLD_MS);
		expect(await sender.submit(signerFor(venue), scale(["90", "96"]))).toMatchObject({ kind: "sent" });
	});

	it("sends a different order on the same market at once", async () => {
		const { sender } = openTab(venue, storage, locks);
		await sender.submit(signerFor(venue), scale(["90", "95"]));
		expect(await sender.submit(signerFor(venue), scale(["90", "96"], { buy: false }))).toMatchObject({ kind: "sent" });
		expect(await sender.submit(signerFor(venue), scale(["91"]))).toMatchObject({ kind: "sent" });
	});
});

describe("order sender seen from another tab", () => {
	let venue: FakeExchange;
	let storage: MemoryKeyValue;
	let locks: LockManagerLike;

	beforeEach(() => {
		venue = createFakeExchange();
		storage = createMemoryKeyValue();
		locks = createMemoryLocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("leaves another tab's send out of its list while it is in flight", async () => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		const bus = createMemoryBus();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const tabA = openTab(venue, storage, locks, { bus: bus.join(), sleep: () => gate });
		const tabB = openTab(venue, storage, locks, { bus: bus.join() });
		const unsubscribe = tabB.sender.subscribe(() => {});
		venue.nextExchangeRequests("lost");
		const pressA = tabA.sender.submit(signerFor(venue), marketBuy());
		await vi.waitFor(() => expect(tabB.store.pending()).toHaveLength(1));
		expect(tabB.sender.list(TEST_USER)).toEqual([]);
		release();
		expect(await pressA).toMatchObject({ kind: "sent", settlement: { kind: "answered" } });
		await vi.waitFor(() => expect(tabB.store.pending()).toHaveLength(0));
		unsubscribe();
	});

	it("shows another tab's unconfirmed request once the grace period ends, and tells its listeners", async () => {
		vi.useFakeTimers({ now: new Date("2026-11-14T12:00:00Z") });
		const bus = createMemoryBus();
		const tabA = openTab(venue, storage, locks, { bus: bus.join() });
		const tabB = openTab(venue, storage, locks, { bus: bus.join() });
		const notified = vi.fn();
		const unsubscribe = tabB.sender.subscribe(notified);
		venue.state.exchangeDown = true;
		const outcome = await tabA.sender.submit(signerFor(venue), marketBuy());
		expect(tabB.sender.list(TEST_USER)).toEqual([]);
		await vi.advanceTimersByTimeAsync(IN_FLIGHT_GRACE_MS);
		expect(notified).toHaveBeenCalled();
		expect(tabB.sender.list(TEST_USER).map(getRequestKey)).toEqual([keyOf(outcome)]);
		unsubscribe();
	});
});
