import { privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createExchangeClock } from "@/lib/trade/exchange-clock";
import {
	classifyReply,
	createOrderSender,
	type LockManagerLike,
	placedNothing,
	type Signer,
	type Submission,
} from "@/lib/trade/order-sender";
import { createRequestStore, getRequestSlot } from "@/lib/trade/pending-requests";
import {
	comesBackUp,
	createFakeExchange,
	createMemoryLocks,
	createMemoryStorage,
	type FakeExchange,
	goesDownOnFirstSend,
	OTHER_AGENT_KEY,
	TEST_AGENT_KEY,
	TEST_USER,
} from "@/test/fake-exchange";

const SOL = 5;
const SLOT = getRequestSlot("testnet", TEST_USER, SOL);
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

function openTab(venue: FakeExchange, storage: Storage, locks: LockManagerLike | null) {
	const store = createRequestStore(() => storage);
	const clock = createExchangeClock(async () => (await venue.info.exchangeStatus()).time, Date.now);
	const sender = createOrderSender({ info: () => venue.info, store, clock, locks: () => locks, sleep: async () => {} });
	return { store, sender };
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
			classifyReply({
				status: "err",
				response: "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.",
			}).kind,
		).toBe("rejected");
	});
});

describe("order sender", () => {
	let venue: FakeExchange;
	let storage: Storage;
	let locks: LockManagerLike;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
		venue = createFakeExchange();
		storage = createMemoryStorage();
		locks = createMemoryLocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("persists the signed request before its first byte reaches the exchange", async () => {
		const { store, sender } = openTab(venue, storage, locks);
		const storedAtArrival: (number | undefined)[] = [];
		venue.state.onArrive = (body) =>
			storedAtArrival.push(store.get(SLOT)?.nonce === body.nonce ? body.nonce : undefined);
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome.kind).toBe("sent");
		expect(storedAtArrival).toEqual([venue.orderRequests()[0].nonce]);
		expect(store.get(SLOT)).toBeNull();
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
		expect(store.get(SLOT)).toBeNull();
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
		expect(store.get(SLOT)).toBeNull();
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
		if (outcome.kind !== "sent") throw new Error("expected a sent request");
		expect(later.sender.list(TEST_USER).map((request) => request.nonce)).toEqual([outcome.settlement.request.nonce]);
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
		expect(outcomes.map((outcome) => outcome.kind).sort()).toEqual(["blocked", "sent"]);
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
		expect(store.get(SLOT)).not.toBeNull();
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
		expect(store.get(SLOT)).toBeNull();
	});

	it("refuses to cancel a request another agent key signed", async () => {
		venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		if (first.kind !== "sent") throw new Error("expected a sent request");
		const { request } = first.settlement;
		const canceled = await sender.cancel(signerFor(venue, OTHER_AGENT_KEY), `${request.slot}#${request.nonce}`);
		expect(canceled.kind).toBe("foreignSigner");
		expect(store.get(SLOT)?.nonce).toBe(request.nonce);
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

	it("keeps a request the exchange rejects without consuming its nonce until the body has lapsed", async () => {
		venue.state.rejectWith = "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.";
		const { store, sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		if (first.kind !== "sent") throw new Error("expected a sent request");
		const key = `${first.settlement.request.slot}#${first.settlement.request.nonce}`;
		vi.setSystemTime(Date.now() + 31_000);
		expect((await sender.retry(key)).kind).toBe("pending");
		vi.setSystemTime(Date.now() + 5_000);
		const lapsed = await sender.retry(key);
		expect(lapsed).toMatchObject({ kind: "lapsed", rejection: venue.state.rejectWith });
		expect(lapsed.kind === "lapsed" && placedNothing(lapsed)).toBe(true);
		expect(store.get(SLOT)).toBeNull();
	});

	it("keeps the exchange's reason when a rejection consumed the nonce", async () => {
		venue.state.rejectWith = "Asset 899999 is out of range.";
		venue.state.rejectConsumes = true;
		const { sender } = openTab(venue, storage, locks);
		const outcome = await sender.submit(signerFor(venue), marketBuy());
		expect(outcome).toMatchObject({
			kind: "sent",
			settlement: {
				kind: "consumed",
				rejection: "Asset 899999 is out of range.",
				lookup: { statuses: [{ status: "unknownOid" }] },
			},
		});
		expect(venue.state.placedLegs).toBe(0);
	});

	it("blocks a new press when an order landed before its agent key was revoked", async () => {
		goesDownOnFirstSend(venue);
		const { sender } = openTab(venue, storage, locks);
		const first = await sender.submit(signerFor(venue), marketBuy());
		expect(first).toMatchObject({ kind: "sent", settlement: { kind: "pending" } });
		comesBackUp(venue);
		venue.state.rejectWith = "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.";
		venue.state.lookupLag = 1;
		vi.setSystemTime(Date.now() + 36_000);
		const second = await sender.submit(signerFor(venue), marketBuy());
		expect(second).toMatchObject({
			kind: "blocked",
			earlier: { kind: "lapsed", lookup: { statuses: [{ order: { status: "filled" } }] } },
		});
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
			settlement: {
				kind: "consumed",
				lookup: { kind: "twap", match: { twapId: started?.twapId, status: { status: "activated" } } },
			},
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
