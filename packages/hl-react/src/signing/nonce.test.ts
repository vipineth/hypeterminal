import { afterEach, describe, expect, it, vi } from "vitest";
import { createNonceManager, type LaneLocks, NONCE_LANES, type NonceManager } from "./nonce";

const AGENT = "0x16F05e773CE03B84Fbb6c55B0642B0B7c6A1aCBb";
const FROZEN_MS = 1_800_000_000_000;
const ONE_DAY_MS = 86_400_000;

function createOrigin(): LaneLocks {
	const held = new Set<string>();
	return {
		async request(name, _options, callback) {
			if (held.has(name)) return callback(null);
			held.add(name);
			return callback({ name, mode: "exclusive" });
		},
	};
}

function freezeClock(ms = FROZEN_MS) {
	return vi.spyOn(Date, "now").mockReturnValue(ms);
}

async function issueInterleaved(tabs: NonceManager[], rounds: number, address = AGENT) {
	const issued = tabs.map((): number[] => []);
	for (let round = 0; round < rounds; round++) {
		for (const [index, tab] of tabs.entries()) {
			issued[index].push(await tab(address));
		}
	}
	return issued;
}

function expectStrictlyIncreasing(nonces: number[]) {
	for (let i = 1; i < nonces.length; i++) {
		expect(nonces[i]).toBeGreaterThan(nonces[i - 1]);
	}
}

function expectInsideWindow(nonces: number[], now = FROZEN_MS) {
	for (const nonce of nonces) {
		expect(nonce).toBeGreaterThanOrEqual(now);
		expect(nonce).toBeLessThan(now + ONE_DAY_MS);
	}
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("createNonceManager", () => {
	it("gives two tabs sharing one agent distinct nonces in the same millisecond", async () => {
		freezeClock();
		const origin = createOrigin();
		const [tab1, tab2] = [createNonceManager(origin), createNonceManager(origin)];

		const [fromTab1, fromTab2] = await issueInterleaved([tab1, tab2], 50);
		const all = [...fromTab1, ...fromTab2];

		expect(new Set(all).size).toBe(all.length);
		expectStrictlyIncreasing(fromTab1);
		expectStrictlyIncreasing(fromTab2);
		expectInsideWindow(all);
	});

	it.skipIf(!globalThis.navigator?.locks)("keeps tabs distinct on the platform navigator.locks", async () => {
		freezeClock();
		const [tab1, tab2] = [createNonceManager(navigator.locks), createNonceManager(navigator.locks)];

		const [fromTab1, fromTab2] = await issueInterleaved([tab1, tab2], 50);
		const all = [...fromTab1, ...fromTab2];

		expect(new Set(all).size).toBe(all.length);
		expectStrictlyIncreasing(fromTab1);
		expectStrictlyIncreasing(fromTab2);
	});

	it(`keeps ${NONCE_LANES} tabs distinct and orders any extra tab on its own`, async () => {
		freezeClock();
		const origin = createOrigin();
		const tabs = Array.from({ length: NONCE_LANES }, () => createNonceManager(origin));
		const extraTab = createNonceManager(origin);

		const issued = await issueInterleaved(tabs, 10);
		const [fromExtraTab] = await issueInterleaved([extraTab], 10);
		const all = issued.flat();

		expect(new Set(all).size).toBe(all.length);
		issued.forEach(expectStrictlyIncreasing);
		expectInsideWindow(all);
		expect(fromExtraTab[0]).toBe(FROZEN_MS);
		expectStrictlyIncreasing(fromExtraTab);
	});

	it("issues distinct nonces to calls made before the tab holds its lane", async () => {
		freezeClock();
		const tab = createNonceManager(createOrigin());

		const nonces = await Promise.all([tab(AGENT), tab(AGENT.toLowerCase()), tab(AGENT)]);

		expect(new Set(nonces).size).toBe(nonces.length);
	});

	it("never reissues when the clock steps backwards", async () => {
		const clock = freezeClock();
		const tab = createNonceManager(createOrigin());

		const before = await tab(AGENT);
		clock.mockReturnValue(FROZEN_MS - 60_000);
		const after = await tab(AGENT);

		expect(after).toBeGreaterThan(before);
	});

	it.each([
		["missing", null],
		[
			"denied",
			{
				request: () => Promise.reject(new DOMException("Access to the Locks API is denied", "SecurityError")),
			},
		],
		[
			"throwing",
			{
				request: () => {
					throw new TypeError("locks unavailable");
				},
			},
		],
	] satisfies [string, LaneLocks | null][])("orders nonces per tab when locks are %s", async (_, locks) => {
		freezeClock();
		const tab = createNonceManager(locks);

		const [nonces] = await issueInterleaved([tab], 5);

		expect(nonces[0]).toBe(FROZEN_MS);
		expectStrictlyIncreasing(nonces);
	});
});
