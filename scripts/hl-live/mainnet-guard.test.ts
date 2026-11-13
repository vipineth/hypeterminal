import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mainnetHoldings } from "./harness";

const user = "0x00000000000000000000000000000000000000aa";

const emptyPerp = { marginSummary: { accountValue: "0.0" }, assetPositions: [] };

function emptyAccount(): Record<string, (request: { dex?: string }) => unknown> {
	return {
		spotClearinghouseState: () => ({ balances: [] }),
		perpDexs: () => [null, { name: "xyz" }],
		clearinghouseState: () => emptyPerp,
		delegatorSummary: () => ({ delegated: "0.0", undelegated: "0.0", totalPendingWithdrawal: "0.0", nPendingWithdrawals: 0 }),
		userVaultEquities: () => [],
		subAccounts: () => null,
		borrowLendUserState: () => ({ tokenToState: [], health: "healthy", healthFactor: null }),
		referral: () => ({ referredBy: null, cumVlm: "0.0", unclaimedRewards: "0.0", claimedRewards: "0.0", builderRewards: "0.0", rewardHistory: [], tokenToState: [] }),
		leadingVaults: () => [],
	};
}

function serveMainnet(overrides: Record<string, (request: { dex?: string }) => unknown> = {}) {
	const reads: string[] = [];
	const account = { ...emptyAccount(), ...overrides };
	vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
		const url = input instanceof Request ? input.url : String(input);
		if (url !== "https://api.hyperliquid.xyz/info") throw new Error(`unexpected request to ${url}`);
		const request = JSON.parse(String(init?.body)) as { type: string; dex?: string };
		reads.push(request.type);
		const answer = account[request.type];
		if (!answer) throw new Error(`the fake mainnet has no ${request.type}`);
		return Response.json(answer(request));
	});
	return { reads, holdings: () => mainnetHoldings(new InfoClient({ transport: new HttpTransport() }), user) };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("mainnet holdings guard", () => {
	it("passes a key that holds nothing anywhere mainnet reports", async () => {
		const mainnet = serveMainnet();
		expect(await mainnet.holdings()).toEqual([]);
		expect(mainnet.reads.filter((read) => read === "clearinghouseState")).toHaveLength(2);
	});

	it("names spot tokens, collateral and positions on any dex", async () => {
		const mainnet = serveMainnet({
			spotClearinghouseState: () => ({ balances: [{ coin: "HYPE", total: "0.01" }] }),
			clearinghouseState: ({ dex }) => (dex === "xyz" ? { marginSummary: { accountValue: "3.5" }, assetPositions: [{ position: { coin: "xyz:NVDA" } }] } : emptyPerp),
		});
		expect(await mainnet.holdings()).toEqual(["0.01 HYPE in spot", "3.5 USDC on xyz", "1 positions on xyz"]);
	});

	it.each([
		["staked HYPE", { delegatorSummary: () => ({ delegated: "100.0", undelegated: "0.0", totalPendingWithdrawal: "0.0", nPendingWithdrawals: 0 }) }, /100.0 HYPE staked/],
		["undelegated HYPE", { delegatorSummary: () => ({ delegated: "0.0", undelegated: "5.0", totalPendingWithdrawal: "0.0", nPendingWithdrawals: 0 }) }, /5.0 HYPE undelegated/],
		["a pending staking withdrawal", { delegatorSummary: () => ({ delegated: "0.0", undelegated: "0.0", totalPendingWithdrawal: "7.0", nPendingWithdrawals: 1 }) }, /7.0 HYPE pending withdrawal/],
		["vault equity", { userVaultEquities: () => [{ vaultAddress: user, equity: "100.0", lockedUntilTimestamp: 0 }] }, /100.0 USDC in vault/],
		["a sub-account", { subAccounts: () => [{ name: "desk", subAccountUser: user, master: user, clearinghouseState: emptyPerp, spotState: { balances: [] } }] }, /sub-account desk/],
		["supplied tokens", { borrowLendUserState: () => ({ tokenToState: [[0, { borrow: { basis: "0.0", value: "0.0" }, supply: { basis: "9.0", value: "9.0" } }]], health: "healthy", healthFactor: null }) }, /9.0 of token 0 supplied/],
		["unclaimed referral rewards", { referral: () => ({ unclaimedRewards: "2.5", builderRewards: "0.0" }) }, /2.5 USDC unclaimed referral rewards/],
		["builder rewards", { referral: () => ({ unclaimedRewards: "0.0", builderRewards: "4.0" }) }, /4.0 USDC builder rewards/],
		["a vault it leads", { leadingVaults: () => [{ address: user, name: "alpha" }] }, /leads vault alpha/],
	])("refuses a key that holds only %s", async (_, overrides, holding) => {
		const holdings = await serveMainnet(overrides).holdings();
		expect(holdings.join(", ")).toMatch(holding);
	});

	it.each([
		["an empty dex list", { perpDexs: () => [] }, "perpDexs"],
		["a dex list without the main dex", { perpDexs: () => [{ name: "xyz" }] }, "perpDexs"],
		["a non-numeric account value", { clearinghouseState: () => ({ marginSummary: { accountValue: "not-a-number" }, assetPositions: [] }) }, "clearinghouseState"],
		["a spot balance with no total", { spotClearinghouseState: () => ({ balances: [{ coin: "HYPE" }] }) }, "spotClearinghouseState"],
		["a staking summary with no delegated amount", { delegatorSummary: () => ({ undelegated: "0.0", totalPendingWithdrawal: "0.0", nPendingWithdrawals: 0 }) }, "delegatorSummary"],
		["a vault list that is not a list", { userVaultEquities: () => ({}) }, "userVaultEquities"],
	])("fails closed on %s", async (_, overrides, read) => {
		await expect(serveMainnet(overrides).holdings()).rejects.toThrow(`mainnet ${read} is not the expected shape`);
	});
});
