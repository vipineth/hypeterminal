import { describe, expect, it } from "vitest";
import { enterUnified, exitUnified, restoreUsdcSplit } from "./account";

interface Account {
	mode: string;
	spotUsdc: string;
	perpUsdc?: string;
	dexes?: string[];
	positions?: Record<string, number>;
	collateral?: Record<string, string>;
	orders?: Record<string, number>;
	twaps?: { twapId: number; status: string }[];
}

function fakeHarness(account: Account) {
	const calls: string[] = [];
	const h = {
		user: "0x00000000000000000000000000000000000000aa",
		info: {
			userAbstraction: async () => account.mode,
			spotClearinghouseState: async () => ({ balances: [{ coin: "USDC", total: account.spotUsdc }] }),
			spotMeta: async () => ({ tokens: [{ name: "USDC", tokenId: "0xusdc" }] }),
			perpDexs: async () => (account.dexes ?? [""]).map((name) => (name === "" ? null : { name })),
			twapHistory: async () =>
				(account.twaps ?? []).map(({ twapId, status }) => ({ time: 1, twapId, state: { coin: "DOGE" }, status: { status } })),
			clearinghouseState: async ({ dex = "" }: { dex?: string }) => {
				calls.push(`clearinghouseState ${dex}`);
				const value = account.collateral?.[dex] ?? (dex === "" ? (account.perpUsdc ?? "0") : "0");
				return {
					marginSummary: { accountValue: value },
					withdrawable: value,
					assetPositions: Array.from({ length: account.positions?.[dex] ?? 0 }, () => ({ position: { coin: "X", szi: "1" } })),
				};
			},
			frontendOpenOrders: async ({ dex }: { dex: string }) => {
				calls.push(`frontendOpenOrders ${dex}`);
				return Array.from({ length: account.orders?.[dex] ?? 0 }, (_, oid) => ({ coin: "X", oid }));
			},
		},
		principal: {
			userSetAbstraction: async ({ abstraction }: { abstraction: string }) => {
				calls.push(`userSetAbstraction ${abstraction}`);
				account.mode = abstraction;
			},
			sendAsset: async ({ sourceDex, destinationDex, amount, token }: Record<string, string>) => {
				calls.push(`sendAsset ${amount} ${token} from "${sourceDex}" to "${destinationDex}"`);
			},
		},
	};
	return { h: h as never, calls };
}

describe("exitUnified", () => {
	it("leaves unified from the live mode and moves spot USDC above the float back to perp, with no note on disk", async () => {
		const { h, calls } = fakeHarness({ mode: "unifiedAccount", spotUsdc: "830" });
		await exitUnified(h);
		expect(calls).toEqual(["userSetAbstraction disabled", 'sendAsset 800 USDC:0xusdc from "spot" to ""']);
	});

	it("only restores the split when the account is already standard", async () => {
		const { h, calls } = fakeHarness({ mode: "disabled", spotUsdc: "30.4" });
		await exitUnified(h);
		expect(calls).toEqual([]);
	});
});

describe("restoreUsdcSplit", () => {
	const sends = (calls: string[]) => calls.filter((call) => call.startsWith("sendAsset"));

	it("tops spot up to the float from perp", async () => {
		const { h, calls } = fakeHarness({ mode: "default", spotUsdc: "12.5", perpUsdc: "100" });
		await restoreUsdcSplit(h);
		expect(sends(calls)).toEqual(['sendAsset 17.5 USDC:0xusdc from "" to "spot"']);
	});

	it("tops up only what perp holds, and signs nothing for an unfunded key", async () => {
		const short = fakeHarness({ mode: "disabled", spotUsdc: "0", perpUsdc: "10" });
		await restoreUsdcSplit(short.h);
		expect(sends(short.calls)).toEqual(['sendAsset 10 USDC:0xusdc from "" to "spot"']);
		const empty = fakeHarness({ mode: "disabled", spotUsdc: "0", perpUsdc: "0" });
		await restoreUsdcSplit(empty.h);
		expect(sends(empty.calls)).toEqual([]);
	});
});

describe("enterUnified", () => {
	const quiet = { mode: "disabled", spotUsdc: "30", dexes: ["", "xyz", "abc"] };

	it("refuses when the account is already unified, so a lost exit is never recorded as the baseline", async () => {
		const { h, calls } = fakeHarness({ ...quiet, mode: "unifiedAccount" });
		await expect(enterUnified(h)).rejects.toThrow(/already unifiedAccount/);
		expect(calls).toEqual([]);
	});

	it("checks positions on every perp dex", async () => {
		const { h, calls } = fakeHarness({ ...quiet, positions: { abc: 1 } });
		await expect(enterUnified(h)).rejects.toThrow(/1 positions on abc/);
		expect(calls.filter((call) => call.startsWith("clearinghouseState"))).toEqual(["clearinghouseState ", "clearinghouseState xyz", "clearinghouseState abc"]);
		expect(calls).not.toContain("userSetAbstraction unifiedAccount");
	});

	it("checks orders across all dexes and on every dex that holds collateral", async () => {
		const { h, calls } = fakeHarness({ ...quiet, collateral: { xyz: "5" }, orders: { xyz: 2 } });
		await expect(enterUnified(h)).rejects.toThrow(/2 orders on xyz/);
		expect(calls).toContain("frontendOpenOrders ALL_DEXS");
	});

	it("refuses while a twap runs", async () => {
		const { h } = fakeHarness({ ...quiet, twaps: [{ twapId: 7, status: "activated" }] });
		await expect(enterUnified(h)).rejects.toThrow(/1 running twaps/);
	});

	it("switches when nothing is open anywhere", async () => {
		const { h, calls } = fakeHarness({ ...quiet, twaps: [{ twapId: 7, status: "terminated" }] });
		await enterUnified(h);
		expect(calls.at(-1)).toBe("userSetAbstraction unifiedAccount");
	});
});
