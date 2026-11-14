import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Dex, type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { buildAccountState, parseAccountMode, type ReadyAccount } from "@/domain/trade/account-mode";
import {
	buildSendAsset,
	dexVenue,
	getDexWithdrawCap,
	getFundDexPlan,
	getFundingNeed,
	getRouteToken,
	getVenueLimit,
	MAIN_PERP,
	SPOT,
} from "@/domain/trade/dex-transfer";
import { type AccountFixture, clearinghouse, standardAccount, TEST_USER } from "@/test/account-fixture";

const meta: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(meta);
const MAINNET_USDC_ID = "0x6d1e7cde53ba9467b783cb7c530ce054";
const MAINNET_USDH_ID = "0x54e00a5988577cb0b0c9ab0cb6ef7f4b";
const USER = TEST_USER as `0x${string}`;

function dex(name: string): Dex {
	const found = model.dexes.find((entry) => entry.name === name);
	if (!found) throw new Error(`no dex ${name}`);
	return found;
}

const usdc = dex("").collateralToken;

function accountOf(name: string): ReadyAccount {
	const captured: AccountFixture = JSON.parse(
		readFileSync(new URL(`./__fixtures__/account/${name}.json`, import.meta.url), "utf8"),
	);
	return buildAccountState({
		user: captured.user,
		spotCurrent: true,
		perpCurrent: true,
		mode: parseAccountMode(captured.webData3UserState.abstraction, captured.webData3UserState.dexAbstractionEnabled),
		clearinghouseStates: captured.clearinghouseStates,
		spot: captured.spot,
	});
}

function ledger(account: ReadyAccount, name: string) {
	if (account.ledger !== "perDex") throw new Error("not a per-dex account");
	const state = account.dexes.get(name);
	if (!state) throw new Error(`no ${name} ledger`);
	return state;
}

describe("sendAsset action shape", () => {
	it("moves USDC from the main perp dex into xyz", () => {
		const route = { from: MAIN_PERP, to: dexVenue("xyz") };
		const token = getRouteToken(route, model.dexes, usdc);
		expect(token && buildSendAsset(USER, route, token, "50")).toEqual({
			destination: USER,
			sourceDex: "",
			destinationDex: "xyz",
			token: `USDC:${MAINNET_USDC_ID}`,
			amount: "50",
		});
	});

	it("moves USDC from xyz back to the main perp dex", () => {
		const route = { from: dexVenue("xyz"), to: MAIN_PERP };
		const token = getRouteToken(route, model.dexes, usdc);
		expect(token && buildSendAsset(USER, route, token, "12.5")).toEqual({
			destination: USER,
			sourceDex: "xyz",
			destinationDex: "",
			token: `USDC:${MAINNET_USDC_ID}`,
			amount: "12.5",
		});
	});

	it("moves USDH from spot into a USDH dex with the USDH token id", () => {
		const route = { from: SPOT, to: dexVenue("flx") };
		const token = getRouteToken(route, model.dexes, usdc);
		expect(token && buildSendAsset(USER, route, token, "3")).toEqual({
			destination: USER,
			sourceDex: "spot",
			destinationDex: "flx",
			token: `USDH:${MAINNET_USDH_ID}`,
			amount: "3",
		});
	});

	it("refuses routes the exchange cannot move", () => {
		expect(getRouteToken({ from: MAIN_PERP, to: dexVenue("flx") }, model.dexes, usdc)).toBeNull();
		expect(getRouteToken({ from: dexVenue("xyz"), to: dexVenue("flx") }, model.dexes, usdc)).toBeNull();
		expect(getRouteToken({ from: dexVenue("xyz"), to: dexVenue("xyz") }, model.dexes, usdc)).toBeNull();
		expect(getRouteToken({ from: SPOT, to: dexVenue("nope") }, model.dexes, usdc)).toBeNull();
	});

	it("builds nothing before spot metadata gives the token id", () => {
		const perpsOnly = parseMarkets({ ...meta, spotMeta: undefined });
		const token = perpsOnly.dexes.find((entry) => entry.name === "xyz")?.collateralToken;
		expect(token?.tokenId).toBeNull();
		expect(token && buildSendAsset(USER, { from: MAIN_PERP, to: dexVenue("xyz") }, token, "1")).toBeNull();
	});
});

describe("withdrawal cap from a dex", () => {
	it("leaves max(initial margin, 10% of position value) behind on a captured xyz ledger", () => {
		const xyz = ledger(accountOf("mainnet-disabled-two-dexes"), "xyz");
		expect(xyz.marginSummary).toMatchObject({
			accountValue: "72546.183129",
			totalMarginUsed: "6062.10122",
			totalNtlPos: "80470.647171",
		});
		expect(getDexWithdrawCap(xyz)).toBe("56427.700923");
	});

	it("caps at the margin floor when the exchange would allow more", () => {
		const state = clearinghouse("100");
		state.marginSummary = { accountValue: "100", totalMarginUsed: "5", totalNtlPos: "200", totalRawUsd: "100" };
		expect(getDexWithdrawCap(state)).toBe("80");
		state.marginSummary.totalMarginUsed = "30";
		expect(getDexWithdrawCap(state)).toBe("70");
	});

	it("never goes below zero", () => {
		const state = clearinghouse("0");
		state.marginSummary = { accountValue: "4", totalMarginUsed: "5", totalNtlPos: "50", totalRawUsd: "4" };
		expect(getDexWithdrawCap(state)).toBe("0");
	});

	it("reads an unfunded dex as zero and a unified account as unverified", () => {
		expect(getVenueLimit(standardAccount([], "10"), dexVenue("xyz"), usdc)).toEqual({ status: "ready", amount: "0" });
		expect(getVenueLimit(standardAccount([], "10"), MAIN_PERP, usdc)).toEqual({ status: "ready", amount: "10" });
		expect(getVenueLimit(accountOf("mainnet-unified-0x8c60"), dexVenue("xyz"), usdc)).toEqual({
			status: "unverifiedTransferLimit",
		});
	});
});

describe("fund a dex from the ticket", () => {
	const shortfall = {
		kind: "dexEmpty" as const,
		dex: dex("xyz"),
		token: usdc,
		elsewhere: [
			{ place: { kind: "perp" as const }, amount: "97.62" },
			{ place: { kind: "spot" as const }, amount: "36.71" },
		],
	};

	it("draws from the larger balance and rounds the need up to the cent", () => {
		expect(getFundDexPlan(shortfall, 12.3401, 2)).toEqual({
			route: { from: MAIN_PERP, to: dexVenue("xyz") },
			amount: "12.35",
		});
	});

	it("never asks for more than the source holds", () => {
		expect(getFundDexPlan(shortfall, 500.2, 2).amount).toBe("97.62");
	});

	it("leaves the amount blank when the ticket has no size", () => {
		expect(getFundDexPlan({ ...shortfall, elsewhere: [{ place: { kind: "spot" }, amount: "5" }] }, 0, 2)).toEqual({
			route: { from: SPOT, to: dexVenue("xyz") },
			amount: "",
		});
	});
});

describe("funding need for a market order", () => {
	const shortfall = {
		kind: "dexEmpty" as const,
		dex: dex("xyz"),
		token: usdc,
		elsewhere: [{ place: { kind: "perp" as const }, amount: "51" }],
	};
	const filledUpTo = (funds: number, mark: number, fill: number, feeRate: number) =>
		Math.floor((funds / (mark / 10 + (fill - mark) + fill * feeRate)) * 1000) / 1000;

	it("matches the partial fills testnet gave when only margin at mark was funded", () => {
		expect(filledUpTo(1.18, 380, 390, 0.00055)).toBe(0.024);
		expect(filledUpTo(1.15, 380.96, 386, 0.00055)).toBe(0.026);
	});

	it("funds enough for the whole size to fill at the slippage price", () => {
		const need = getFundingNeed({
			orderType: "market",
			side: "buy",
			size: 0.03,
			price: 380,
			markPx: 380,
			leverage: 10,
			slippageBps: 300,
			feeRate: 0.00055,
		});
		const amount = Number(getFundDexPlan(shortfall, need, 2).amount);

		expect(amount).toBe(1.53);
		expect(filledUpTo(amount, 380, 391.4, 0.00055)).toBeGreaterThanOrEqual(0.03);
	});

	it("funds a resting limit buy below mark at margin on mark plus fee", () => {
		const need = getFundingNeed({
			orderType: "limit",
			side: "buy",
			size: 0.03,
			price: 370,
			markPx: 380,
			leverage: 10,
			slippageBps: 300,
			feeRate: 0.00055,
		});

		expect(getFundDexPlan(shortfall, need, 2).amount).toBe("1.15");
	});

	it("asks for nothing without a size", () => {
		const need = getFundingNeed({
			orderType: "market",
			side: "sell",
			size: 0,
			price: 380,
			markPx: 380,
			leverage: 10,
			slippageBps: 300,
			feeRate: 0.00055,
		});

		expect(getFundDexPlan(shortfall, need, 2).amount).toBe("");
	});
});
