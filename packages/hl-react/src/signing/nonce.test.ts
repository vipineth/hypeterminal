import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNonceManager, type HighWaterStorage, type LaneLocks, NONCE_LANES, type NonceManager } from "./nonce";

const AGENT = "0x16F05e773CE03B84Fbb6c55B0642B0B7c6A1aCBb";
const FROZEN_MS = 1_800_000_000_000;
const ONE_DAY_MS = 86_400_000;
const ONE_STRIDE_MS = NONCE_LANES + 1;

type Verdict = "accepted" | "outside time window" | "duplicate" | "below stored-100 floor";

function createStorage(): HighWaterStorage {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => {
			items.set(key, value);
		},
	};
}

function createOrigin() {
	const held = new Map<string, symbol>();
	const storage = createStorage();
	function openTab() {
		const tab = Symbol("tab");
		const locks: LaneLocks = {
			async request(name, _options, callback) {
				if (held.has(name)) return callback(null);
				held.set(name, tab);
				return callback({ name, mode: "exclusive" });
			},
		};
		function close() {
			for (const [name, owner] of held) {
				if (owner === tab) held.delete(name);
			}
		}
		return { nextNonce: createNonceManager(locks, storage), close };
	}
	return { openTab };
}

function createExchange() {
	const used = new Set<number>();
	let highest: number[] = [];
	return function submit(nonce: number): Verdict {
		const blockTime = Date.now();
		if (nonce <= blockTime - 2 * ONE_DAY_MS || nonce >= blockTime + ONE_DAY_MS) return "outside time window";
		if (used.has(nonce)) return "duplicate";
		if (highest.length === 100 && nonce <= highest[0]) return "below stored-100 floor";
		used.add(nonce);
		highest = [...highest, nonce].sort((a, b) => a - b).slice(-100);
		return "accepted";
	};
}

async function take(nextNonce: NonceManager, address = AGENT) {
	const nonce = nextNonce(address);
	await vi.runAllTimersAsync();
	return nonce;
}

async function signRounds(tabs: NonceManager[], rounds: number) {
	const submit = createExchange();
	const rejected: { tab: number; nonce: number; verdict: Verdict }[] = [];
	for (let round = 0; round < rounds; round++) {
		for (const [tab, nextNonce] of tabs.entries()) {
			const nonce = await take(nextNonce);
			const verdict = submit(nonce);
			if (verdict !== "accepted") rejected.push({ tab, nonce, verdict });
		}
	}
	return rejected;
}

beforeEach(() => {
	vi.useFakeTimers({ now: FROZEN_MS });
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("createNonceManager", () => {
	it("gives two tabs sharing one agent nonces the exchange accepts in the same millisecond", async () => {
		const origin = createOrigin();
		const tabs = [origin.openTab().nextNonce, origin.openTab().nextNonce];

		expect(await signRounds(tabs, 50)).toEqual([]);
	});

	it.skipIf(!globalThis.navigator?.locks)("keeps tabs distinct on the platform navigator.locks", async () => {
		const storage = createStorage();
		const tabs = [createNonceManager(navigator.locks, storage), createNonceManager(navigator.locks, storage)];

		expect(await signRounds(tabs, 20)).toEqual([]);
	});

	it.each([
		["missing", () => createNonceManager(null)],
		[
			"denied",
			() =>
				createNonceManager({
					request: () => Promise.reject(new DOMException("Access to the Locks API is denied", "SecurityError")),
				}),
		],
		[
			"throwing",
			() =>
				createNonceManager({
					request: () => {
						throw new TypeError("locks unavailable");
					},
				}),
		],
		["exhausted", (origin: ReturnType<typeof createOrigin>) => origin.openTab().nextNonce],
	] satisfies [string, (origin: ReturnType<typeof createOrigin>) => NonceManager][])(
		`keeps a tab whose locks are %s off all ${NONCE_LANES} leased lanes`,
		async (_, openUncoordinatedTab) => {
			const origin = createOrigin();
			const leasedTabs = Array.from({ length: NONCE_LANES }, () => origin.openTab().nextNonce);

			expect(await signRounds([...leasedTabs, openUncoordinatedTab(origin)], 10)).toEqual([]);
		},
	);

	it("keeps a slower tab above the stored-100 floor while another tab signs every 5 ms", async () => {
		const origin = createOrigin();
		const [fast, slow] = [origin.openTab().nextNonce, origin.openTab().nextNonce];
		const submit = createExchange();
		const verdicts = [submit(await take(fast)), submit(await take(slow))];

		for (let action = 0; action < 200; action++) {
			vi.advanceTimersByTime(5);
			verdicts.push(submit(await take(fast)));
		}
		vi.advanceTimersByTime(5);
		const slowVerdict = submit(await take(slow));

		expect(verdicts.filter((verdict) => verdict !== "accepted")).toEqual([]);
		expect(slowVerdict).toBe("accepted");
	});

	it("never reissues a nonce when a reloaded tab takes over the closed tab's lane", async () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const origin = createOrigin();
		const closing = origin.openTab();
		const submit = createExchange();
		const verdicts: Verdict[] = [];

		for (let action = 0; action < 20; action++) {
			verdicts.push(submit(await take(closing.nextNonce)));
			vi.advanceTimersByTime(5);
		}
		verdicts.push(submit(await take(origin.openTab().nextNonce)));
		closing.close();
		vi.advanceTimersByTime(5);
		verdicts.push(submit(await take(origin.openTab().nextNonce)));

		expect(verdicts.filter((verdict) => verdict !== "accepted")).toEqual([]);
	});

	it("never runs more than one stride ahead of the clock under sustained load", async () => {
		const nextNonce = createOrigin().openTab().nextNonce;
		const leads: number[] = [];

		for (let action = 0; action < 1000; action++) {
			vi.advanceTimersByTime(1);
			leads.push((await take(nextNonce)) - Date.now());
		}

		expect(Math.max(...leads)).toBeLessThanOrEqual(ONE_STRIDE_MS);
	});

	it("issues distinct nonces to calls made before the tab holds its lane", async () => {
		const nextNonce = createOrigin().openTab().nextNonce;

		const pending = Promise.all([nextNonce(AGENT), nextNonce(AGENT.toLowerCase()), nextNonce(AGENT)]);
		await vi.runAllTimersAsync();
		const nonces = await pending;

		expect(new Set(nonces).size).toBe(nonces.length);
	});

	it("keeps signing within one stride when the clock steps backwards", async () => {
		const nextNonce = createOrigin().openTab().nextNonce;

		const before = await take(nextNonce);
		vi.setSystemTime(FROZEN_MS - 60_000);
		const after = await take(nextNonce);

		expect(after).toBeGreaterThan(before);
		expect(Date.now() - (FROZEN_MS - 60_000)).toBeLessThanOrEqual(ONE_STRIDE_MS);
	});

	it("keeps issuing when storage throws", async () => {
		const failing: HighWaterStorage = {
			getItem: () => {
				throw new DOMException("The operation is insecure.", "SecurityError");
			},
			setItem: () => {
				throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
			},
		};
		const grantAll: LaneLocks = { request: async (name, _options, callback) => callback({ name, mode: "exclusive" }) };

		expect(await signRounds([createNonceManager(grantAll, failing)], 3)).toEqual([]);
	});
});
