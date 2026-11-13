import { IDBDatabase, IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyValueStore } from "@/lib/trade/pending-requests";
import { createFakeExchange, createMemoryLocks, type FakeExchange, TEST_AGENT_KEY, TEST_USER } from "@/test/fake-exchange";

const RECORD_PREFIX = "hypeterminal:pending-request:v2:";

async function openBrowserStore(): Promise<KeyValueStore> {
	vi.resetModules();
	vi.stubGlobal("window", globalThis);
	vi.stubGlobal("indexedDB", new IDBFactory());
	const { getBrowserKeyValue } = await import("@/lib/trade/browser-env");
	const store = getBrowserKeyValue();
	if (!store) throw new Error("expected an IndexedDB store");
	return store;
}

async function openTab(venue: FakeExchange, keyValue: KeyValueStore, locks = createMemoryLocks()) {
	const { createOrderSender } = await import("@/lib/trade/order-sender");
	const { createRequestStore } = await import("@/lib/trade/pending-requests");
	return createOrderSender({
		info: () => venue.info,
		store: createRequestStore(() => keyValue),
		clock: { now: async () => Date.now(), estimate: () => Date.now(), warm() {} },
		locks: () => locks,
		sleep: async () => {},
	});
}

function marketBuy(cloid: `0x${string}`) {
	return {
		kind: "order" as const,
		params: {
			orders: [{ a: 5, b: true, p: "90", s: "1", r: false, t: { limit: { tif: "FrontendMarket" as const } }, c: cloid }],
			grouping: "na" as const,
		},
		legs: [{ role: "order" as const, price: "90" }],
		label: { market: "SOL", side: "buy" as const, size: "1" },
	};
}

function signerFor(venue: FakeExchange) {
	return { user: TEST_USER, config: { transport: venue.transport, wallet: privateKeyToAccount(TEST_AGENT_KEY) } };
}

describe("order records in IndexedDB", () => {
	let venue: FakeExchange;

	beforeEach(() => {
		venue = createFakeExchange();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("reads back a record from a second connection once its write has resolved", async () => {
		const store = await openBrowserStore();
		await store.set(`${RECORD_PREFIX}a`, { state: "settled", nonce: 1 });
		const reader = await new Promise<IDBDatabase>((resolve, reject) => {
			const opening = indexedDB.open("hypeterminal-orders", 1);
			opening.onsuccess = () => resolve(opening.result);
			opening.onerror = () => reject(opening.error);
		});
		const value = await new Promise((resolve) => {
			const request = reader.transaction("requests", "readonly").objectStore("requests").get(`${RECORD_PREFIX}a`);
			request.onsuccess = () => resolve(request.result);
		});
		expect(value).toEqual({ state: "settled", nonce: 1 });
		expect(await store.keys()).toEqual([`${RECORD_PREFIX}a`]);
	});

	it("sends nothing when the signed request's write aborts after its put succeeded", async () => {
		const store = await openBrowserStore();
		const put = IDBObjectStore.prototype.put;
		vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
			this: IDBObjectStore,
			value: unknown,
			key?: IDBValidKey,
		) {
			const request = put.call(this, value, key);
			if (String(key).startsWith(RECORD_PREFIX)) request.addEventListener("success", () => this.transaction.abort());
			return request;
		});
		const sender = await openTab(venue, store);
		const outcome = await sender.submit(signerFor(venue), marketBuy("0xe1000000000000000000000000000001"));
		expect(venue.exchangeRequests).toEqual([]);
		expect(outcome).toEqual({ kind: "refused", reason: "storage" });
		expect(await store.keys()).not.toContain(expect.stringMatching(RECORD_PREFIX));
	});

	it("asks the browser to flush every write to disk before it reports it saved", async () => {
		const store = await openBrowserStore();
		const transaction = IDBDatabase.prototype.transaction;
		const opened: IDBTransaction[] = [];
		vi.spyOn(IDBDatabase.prototype, "transaction").mockImplementation(function (
			this: IDBDatabase,
			...args: Parameters<IDBDatabase["transaction"]>
		) {
			const created = transaction.apply(this, args);
			opened.push(created);
			return created;
		});
		await store.set(`${RECORD_PREFIX}a`, { state: "settled", nonce: 1 });
		await store.get(`${RECORD_PREFIX}a`);
		const used = opened.filter((created) => created.mode !== "versionchange");
		expect(used.map((created) => [created.mode, created.durability])).toEqual([
			["readwrite", "strict"],
			["readonly", "strict"],
		]);
	});

	it("sends nothing over an earlier request when its record cannot be read", async () => {
		const store = await openBrowserStore();
		const locks = createMemoryLocks();
		venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		await (await openTab(venue, store, locks)).submit(
			signerFor(venue),
			marketBuy("0xe1000000000000000000000000000002"),
		);
		const sentBefore = venue.exchangeRequests.length;
		vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(() => {
			throw new DOMException("Connection to Indexed Database server lost.", "UnknownError");
		});
		const outcome = await (await openTab(venue, store, locks)).submit(
			signerFor(venue),
			marketBuy("0xe1000000000000000000000000000003"),
		);
		venue.deliverInTransit();
		expect(venue.state.placedLegs).toBe(1);
		expect(venue.exchangeRequests).toHaveLength(sentBefore);
		expect(outcome).toEqual({ kind: "refused", reason: "storage" });
	});
});
