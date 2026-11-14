import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Market, type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { type AccountMode, buildAccountState, type ReadyAccount } from "@/domain/trade/account-mode";
import {
	type AccountSummary,
	getAccountSummary,
	getBalances,
	getSpendableSpotTokens,
	getSpendLimit,
	isWithinSpendLimit,
} from "@/domain/trade/balances";
import { type AccountFixture, clearinghouse, SEEN_NOW, TEST_USER } from "@/test/account-fixture";

const meta: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const { dexes, byName } = parseMarkets(meta);

function market(name: string): Market {
	const found = byName.get(name);
	if (!found) throw new Error(`no market ${name}`);
	return found;
}

const STANDARD: AccountMode = { kind: "standard", raw: "disabled" };
const UNIFIED: AccountMode = { kind: "unified" };
const PORTFOLIO: AccountMode = { kind: "portfolio" };
const LEGACY: AccountMode = { kind: "legacyDexAbstraction" };
const UNKNOWN: AccountMode = { kind: "unknown", raw: "somethingNew" };

function fixture(name: string): AccountFixture {
	return JSON.parse(readFileSync(new URL(`./__fixtures__/account/${name}.json`, import.meta.url), "utf8"));
}

function accountOf(name: string, mode: AccountMode, funded: Record<string, string> = {}): ReadyAccount {
	const captured = fixture(name);
	return buildAccountState({
		user: captured.user,
		generation: 0,
		spotSeen: SEEN_NOW,
		mode,
		clearinghouseStates: captured.clearinghouseStates.map(([dex, state]) => [
			dex,
			funded[dex] ? clearinghouse(funded[dex]) : state,
		]),
		spot: captured.spot,
	});
}

function readyBalances(account: ReadyAccount, hideSmall = false) {
	const balances = getBalances(account, dexes, false, hideSmall);
	if (balances.status !== "ready") throw new Error("expected ready balances");
	return balances;
}

function rowView(row: ReturnType<typeof readyBalances>["perp"][number]) {
	return {
		asset: row.asset,
		dexLabel: row.dexLabel,
		available: row.available,
		total: row.total,
		transfer: row.transfer,
		canSend: row.canSend,
	};
}

describe("balance rows", () => {
	it("shows one perp row per funded dex for a standard account, labelled by dex", () => {
		const balances = readyBalances(accountOf("mainnet-disabled-two-dexes", STANDARD));

		expect(balances.perp.map(rowView)).toEqual([
			{
				asset: "USDC",
				dexLabel: null,
				available: "64116.532932",
				total: "121166.943682",
				transfer: "toSpot",
				canSend: true,
			},
			{
				asset: "USDC",
				dexLabel: "io",
				available: "12761.264984",
				total: "12761.264984",
				transfer: null,
				canSend: false,
			},
			{
				asset: "USDC",
				dexLabel: "xyz",
				available: "56427.700923",
				total: "72546.183129",
				transfer: null,
				canSend: false,
			},
		]);
		expect(balances.spot.map(rowView)).toEqual([
			{
				asset: "USDC",
				dexLabel: null,
				available: "0.00000009",
				total: "0.00000009",
				transfer: "toPerp",
				canSend: true,
			},
		]);
		expect(balances.totalUsd).toBe("206474.39179509");
	});

	it("gives every row a distinct key when several dexes hold USDC", () => {
		const balances = readyBalances(accountOf("mainnet-disabled-two-dexes", STANDARD));
		const keys = [...balances.perp, ...balances.spot].map((row) => row.key);

		expect(new Set(keys).size).toBe(keys.length);
	});

	it("names a USDH builder dex row by its own collateral", () => {
		const balances = readyBalances(accountOf("p3-default", STANDARD, { flx: "250.5" }));

		expect(balances.perp.map(rowView)).toEqual([
			{ asset: "USDC", dexLabel: null, available: "97.617353", total: "97.617353", transfer: "toSpot", canSend: true },
			{ asset: "USDH", dexLabel: "flx", available: "250.5", total: "250.5", transfer: null, canSend: false },
		]);
	});

	it.each([
		["unified", UNIFIED],
		["portfolio", PORTFOLIO],
	])("shows no perp rows for a %s account and spends spot after maintenance", (_name, mode) => {
		const balances = readyBalances(accountOf("mainnet-unified-0x8c60", mode, { flx: "900" }));

		expect(balances.perp).toEqual([]);
		expect(balances.spot.map(rowView)).toEqual([
			{
				asset: "USDC",
				dexLabel: null,
				available: "66207.01836979",
				total: "68423.40402379",
				transfer: null,
				canSend: true,
			},
		]);
		expect(balances.totalUsd).toBe("68423.40402379");
	});

	it("hides rows under the small balance threshold and counts only what is shown", () => {
		const balances = readyBalances(accountOf("mainnet-disabled-two-dexes", STANDARD), true);

		expect(balances.perp).toHaveLength(3);
		expect(balances.spot).toEqual([]);
		expect(balances.isEmpty).toBe(false);
	});

	it("shows the main dex row before market data loads", () => {
		const balances = getBalances(accountOf("mainnet-disabled-main-only", STANDARD), [], true, false);

		expect(balances).toMatchObject({ status: "ready", isEmpty: false });
		if (balances.status !== "ready") return;
		expect(balances.perp.map(rowView)).toEqual([
			{
				asset: "USDC",
				dexLabel: null,
				available: "2604750.100751",
				total: "2949301.7768819998",
				transfer: "toSpot",
				canSend: true,
			},
		]);
	});

	it("waits for market data before naming a funded builder dex's collateral", () => {
		expect(getBalances(accountOf("mainnet-disabled-two-dexes", STANDARD), [], true, false)).toEqual({ status: "loading" });
	});

	it("still shows a funded dex whose collateral the market model could not resolve", () => {
		const balances = getBalances(accountOf("mainnet-disabled-two-dexes", STANDARD), [], false, false);

		expect(balances.status === "ready" && balances.perp.map((row) => [row.asset, row.dexLabel])).toEqual([
			["USDC", null],
			["io", "io"],
			["xyz", "xyz"],
		]);
	});

	it("passes loading and error through without rows", () => {
		expect(getBalances({ status: "loading" }, dexes, false, false)).toEqual({ status: "loading" });
		expect(getBalances({ status: "error" }, dexes, false, false)).toEqual({ status: "error" });
	});
});

describe("spot rows by payload", () => {
	function spotOnly(mode: AccountMode, spot: ReadyAccount["spot"]): ReadyAccount {
		return buildAccountState({
			user: TEST_USER,
			mode,
			generation: 0,
			clearinghouseStates: [],
			spot,
			spotSeen: SEEN_NOW,
		});
	}
	const usdc = { coin: "USDC", token: 0, total: "100.0", hold: "25.0", entryNtl: "0.0" };

	it("shows total minus hold for a standard account on the old payload", () => {
		const balances = readyBalances(spotOnly(STANDARD, { balances: [usdc] }));

		expect(balances.spot.map(rowView)).toEqual([
			{ asset: "USDC", dexLabel: null, available: "75", total: "100.0", transfer: "toPerp", canSend: true },
		]);
		expect(getSpendLimit(spotOnly(STANDARD, { balances: [usdc] }), "spot", "USDC")).toEqual({
			status: "ready",
			amount: "75",
		});
	});

	it("shows no spendable amount for a unified account whose payload has no maintenance tuple", () => {
		const account = spotOnly(UNIFIED, { balances: [usdc] });

		expect(readyBalances(account).spot.map((row) => row.available)).toEqual([null]);
		expect(getSpendLimit(account, "spot", "USDC")).toEqual({ status: "pending" });
		expect(getSpendableSpotTokens(account)).toEqual([]);
	});
});

describe("spend limits", () => {
	it("limits a perp send to main dex withdrawable for a standard account", () => {
		const account = accountOf("mainnet-disabled-two-dexes", STANDARD);

		expect(getSpendLimit(account, "perp", "USDC")).toEqual({ status: "ready", amount: "64116.532932" });
	});

	it("leaves a unified perp send to the exchange", () => {
		const limit = getSpendLimit(accountOf("mainnet-unified-0x8c60", UNIFIED), "perp", "USDC");

		expect(limit).toEqual({ status: "unverifiedTransferLimit" });
		expect(isWithinSpendLimit("1000000", limit)).toBe(true);
		expect(isWithinSpendLimit("0", limit)).toBe(false);
	});

	it("limits a spot spend to the token's available after maintenance", () => {
		const limit = getSpendLimit(accountOf("mainnet-unified-0x8c60", UNIFIED), "spot", "USDC");

		expect(limit).toEqual({ status: "ready", amount: "66207.01836979" });
		expect(isWithinSpendLimit("66207.01836979", limit)).toBe(true);
		expect(isWithinSpendLimit("66207.0183698", limit)).toBe(false);
	});

	it("blocks every spend while the account loads", () => {
		const limit = getSpendLimit({ status: "loading" }, "spot", "USDC");

		expect(limit).toEqual({ status: "pending" });
		expect(isWithinSpendLimit("1", limit)).toBe(false);
	});

	it("offers only spot tokens with something available to send", () => {
		expect(getSpendableSpotTokens(accountOf("mainnet-unified-0x8c60", UNIFIED))).toEqual(["USDC"]);
		expect(getSpendableSpotTokens(accountOf("mainnet-disabled-main-only", STANDARD))).toEqual([]);
	});
});

function overviewView(summary: AccountSummary) {
	if (summary.status !== "ready") return summary;
	const { perps } = summary;
	const base = { place: perps.place, token: perps.token.displayName, notice: perps.notice };
	if (perps.kind === "spot") return { ...base, total: perps.total, available: perps.available };
	return { ...base, equity: perps.metrics.equity, available: perps.metrics.available };
}

describe("account summary", () => {
	const twoDexes = accountOf("mainnet-disabled-two-dexes", STANDARD);
	const unified = accountOf("mainnet-unified-0x8c60", UNIFIED);

	it.each([
		[
			"standard on a USDC builder dex",
			twoDexes,
			"xyz:NVDA",
			{
				place: { kind: "dex", name: "xyz" },
				token: "USDC",
				notice: null,
				equity: "72546.183129",
				available: "56427.700923",
			},
		],
		[
			"standard on a USDH builder dex",
			twoDexes,
			"flx:NVDA",
			{ place: { kind: "dex", name: "flx" }, token: "USDH", notice: null, equity: "0", available: "0" },
		],
		[
			"standard on the main dex",
			twoDexes,
			"BTC",
			{ place: { kind: "perps" }, token: "USDC", notice: null, equity: "121166.943682", available: "64116.532932" },
		],
		[
			"unified on a USDC builder dex",
			unified,
			"xyz:NVDA",
			{
				place: { kind: "unified" },
				token: "USDC",
				notice: "shared",
				total: "68423.40402379",
				available: "66207.01836979",
			},
		],
		[
			"unified on a USDH builder dex",
			unified,
			"flx:NVDA",
			{ place: { kind: "unified" }, token: "USDH", notice: "shared", total: "0", available: "0" },
		],
		[
			"portfolio on a USDC builder dex",
			accountOf("mainnet-unified-0x8c60", PORTFOLIO),
			"xyz:NVDA",
			{
				place: { kind: "portfolio" },
				token: "USDC",
				notice: "shared",
				total: "68423.40402379",
				available: "66207.01836979",
			},
		],
		[
			"portfolio on a USDH builder dex",
			accountOf("mainnet-unified-0x8c60", PORTFOLIO),
			"flx:NVDA",
			{ place: { kind: "portfolio" }, token: "USDH", notice: "shared", total: "0", available: "0" },
		],
		[
			"legacy on a USDC builder dex draws on the main dex",
			accountOf("mainnet-disabled-two-dexes", LEGACY),
			"xyz:NVDA",
			{ place: { kind: "perps" }, token: "USDC", notice: "legacy", equity: "121166.943682", available: "64116.532932" },
		],
		[
			"legacy on a USDH builder dex draws on spot",
			accountOf("mainnet-disabled-two-dexes", LEGACY),
			"flx:NVDA",
			{ place: { kind: "spot" }, token: "USDH", notice: "legacy", total: "0", available: "0" },
		],
		[
			"unknown mode",
			accountOf("mainnet-unified-0x8c60", UNKNOWN),
			"xyz:NVDA",
			{
				place: { kind: "unknown" },
				token: "USDC",
				notice: "unknown",
				total: "68423.40402379",
				available: "66207.01836979",
			},
		],
	])("names the collateral behind the market: %s", (_name, account, marketName, expected) => {
		expect(overviewView(getAccountSummary(account, market(marketName)))).toEqual(expected);
	});

	it("never reads a unified account's per-dex balance", () => {
		const summary = getAccountSummary(unified, market("xyz:NVDA"));

		expect(JSON.stringify(summary)).not.toContain("4433.0458");
	});

	it("falls back to the main dex when a spot market is selected", () => {
		expect(overviewView(getAccountSummary(twoDexes, market("@107")))).toMatchObject({ place: { kind: "perps" } });
		expect(overviewView(getAccountSummary(unified, market("@107")))).toMatchObject({ place: { kind: "unified" } });
	});

	it("sums perps equity across funded dexes and hides it for a unified account", () => {
		const standardSummary = getAccountSummary(twoDexes, undefined);
		const unifiedSummary = getAccountSummary(unified, undefined);

		expect(standardSummary).toMatchObject({ perpsEquity: "206474.391795", spotEquity: "0.00000009" });
		expect(unifiedSummary).toMatchObject({ perpsEquity: null, spotEquity: "68423.40402379" });
	});

	it("stays pending while the account loads", () => {
		expect(getAccountSummary({ status: "loading" }, market("BTC"))).toEqual({ status: "pending" });
	});
});
