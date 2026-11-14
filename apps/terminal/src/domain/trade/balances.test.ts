import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { type AccountMode, buildAccountState, type ReadyAccount } from "@/domain/trade/account-mode";
import { getBalances, getSpendableSpotTokens, getSpendLimit, isWithinSpendLimit } from "@/domain/trade/balances";
import { type AccountFixture, clearinghouse } from "@/test/account-fixture";

const meta: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const { dexes } = parseMarkets(meta);

const STANDARD: AccountMode = { kind: "standard", raw: "disabled" };
const UNIFIED: AccountMode = { kind: "unified" };
const PORTFOLIO: AccountMode = { kind: "portfolio" };

function fixture(name: string): AccountFixture {
	return JSON.parse(readFileSync(new URL(`./__fixtures__/account/${name}.json`, import.meta.url), "utf8"));
}

function accountOf(name: string, mode: AccountMode, funded: Record<string, string> = {}): ReadyAccount {
	const captured = fixture(name);
	return buildAccountState({
		user: captured.user,
		mode,
		clearinghouseStates: captured.clearinghouseStates.map(([dex, state]) => [
			dex,
			funded[dex] ? clearinghouse(funded[dex]) : state,
		]),
		spot: captured.spot,
	});
}

function readyBalances(account: ReadyAccount, hideSmall = false) {
	const balances = getBalances(account, dexes, hideSmall);
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

	it("passes loading and error through without rows", () => {
		expect(getBalances({ status: "loading" }, dexes, false)).toEqual({ status: "loading" });
		expect(getBalances({ status: "error" }, dexes, false)).toEqual({ status: "error" });
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
		expect(getSpendableSpotTokens(fixture("mainnet-unified-0x8c60").spot)).toEqual(["USDC"]);
		expect(getSpendableSpotTokens(fixture("mainnet-disabled-main-only").spot)).toEqual([]);
	});
});
