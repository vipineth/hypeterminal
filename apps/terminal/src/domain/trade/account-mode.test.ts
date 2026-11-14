import { readFileSync } from "node:fs";
import Big from "big.js";
import { describe, expect, it } from "vitest";
import { type Market, type MetaPayloads, parseMarkets } from "@/domain/market/model";
import {
	type AccountMode,
	type AccountState,
	buildAccountState,
	getCollateralSource,
	getTradeCollateral,
	getTransferLimit,
	parseAccountMode,
	type QuoteCheck,
	type ReadyAccount,
} from "@/domain/trade/account-mode";
import { type AccountFixture, SEEN_NOW } from "@/test/account-fixture";

const meta: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(meta);

function market(name: string): Market {
	const found = model.byName.get(name);
	if (!found) throw new Error(`no market ${name}`);
	return found;
}

function fixture(name: string): AccountFixture {
	return JSON.parse(readFileSync(new URL(`./__fixtures__/account/${name}.json`, import.meta.url), "utf8"));
}

function accountOf(name: string, mode?: AccountMode): ReadyAccount {
	const captured = fixture(name);
	return buildAccountState({
		user: captured.user,
		generation: 0,
		spotSeen: SEEN_NOW,
		mode:
			mode ??
			parseAccountMode(captured.webData3UserState.abstraction, captured.webData3UserState.dexAbstractionEnabled),
		clearinghouseStates: captured.clearinghouseStates,
		spot: captured.spot,
	});
}

function liveQuote(name: string, coin: string): QuoteCheck {
	return { status: "live", quote: fixture(name).activeAssetData[coin], leverage: null, seen: SEEN_NOW };
}

const MODES: Record<string, AccountMode> = {
	standard: { kind: "standard", raw: "default" },
	legacy: { kind: "legacyDexAbstraction" },
	unified: { kind: "unified" },
	portfolio: { kind: "portfolio" },
	unknown: { kind: "unknown", raw: "somethingNew" },
};

describe("parseAccountMode", () => {
	it.each([
		["webData3 key absent (P3 live)", undefined, undefined, { kind: "standard", raw: "default" }],
		["userAbstraction null", null, undefined, { kind: "standard", raw: "default" }],
		["default", "default", undefined, { kind: "standard", raw: "default" }],
		["disabled", "disabled", undefined, { kind: "standard", raw: "disabled" }],
		["unifiedAccount", "unifiedAccount", undefined, { kind: "unified" }],
		["portfolioMargin", "portfolioMargin", undefined, { kind: "portfolio" }],
		["dexAbstraction", "dexAbstraction", undefined, { kind: "legacyDexAbstraction" }],
		["legacy flag on a standard account", undefined, true, { kind: "legacyDexAbstraction" }],
		["legacy flag on a disabled account", "disabled", true, { kind: "legacyDexAbstraction" }],
		["legacy flag under unified", "unifiedAccount", true, { kind: "unified" }],
		["legacy flag under portfolio", "portfolioMargin", true, { kind: "portfolio" }],
		["an unseen value", "somethingNew", undefined, { kind: "unknown", raw: "somethingNew" }],
	])("%s", (_label, abstraction, legacy, expected) => {
		expect(parseAccountMode(abstraction, legacy)).toEqual(expected);
	});

	it("reads every captured account's mode the way userAbstraction names it", () => {
		const expected: Record<string, AccountMode["kind"]> = {
			"p3-default": "standard",
			"p1-disabled": "standard",
			"mainnet-unified-0x8c60": "unified",
			"mainnet-disabled-two-dexes": "standard",
			"mainnet-disabled-main-only": "standard",
		};
		for (const [name, kind] of Object.entries(expected)) {
			const { webData3UserState, userAbstraction } = fixture(name);
			const mode = parseAccountMode(webData3UserState.abstraction, webData3UserState.dexAbstractionEnabled);
			expect(mode.kind, name).toBe(kind);
			expect(parseAccountMode(userAbstraction).kind, name).toBe(kind);
		}
	});
});

describe("account ledgers", () => {
	it("keeps per-dex ledgers for a standard account", () => {
		const account = accountOf("p3-default");
		expect(account.ledger).toBe("perDex");
		if (account.ledger !== "perDex") return;
		expect(account.dexes.get("")?.withdrawable).toBe("97.617353");
		expect(account.dexes.get("xyz")?.marginSummary.accountValue).toBe("0.0");
	});

	it("drops per-dex balances for a unified account and keeps its positions", () => {
		const account = accountOf("mainnet-unified-0x8c60");
		expect(account.ledger).toBe("spotOnly");
		if (account.ledger !== "spotOnly") return;
		expect(account.positions.get("xyz")).toHaveLength(1);
		// @ts-expect-error a unified account has no per-dex withdrawable to read
		expect(account.dexes).toBeUndefined();
	});
});

describe("collateral source per mode and market", () => {
	const markets = { main: "BTC", usdcBuilder: "xyz:NVDA", usdhBuilder: "flx:NVDA", spot: "@107" };
	const expected: Record<string, Record<keyof typeof markets, string>> = {
		standard: { main: "dex:", usdcBuilder: "dex:xyz", usdhBuilder: "dex:flx", spot: "spot:USDC" },
		legacy: { main: "dex:", usdcBuilder: "mainVia:xyz", usdhBuilder: "spot:USDH", spot: "spot:USDC" },
		unified: { main: "spot:USDC", usdcBuilder: "spot:USDC", usdhBuilder: "spot:USDH", spot: "spot:USDC" },
		portfolio: {
			main: "exchangeOnly:USDC",
			usdcBuilder: "exchangeOnly:USDC",
			usdhBuilder: "exchangeOnly:USDH",
			spot: "spot:USDC",
		},
		unknown: {
			main: "exchangeOnly:USDC",
			usdcBuilder: "exchangeOnly:USDC",
			usdhBuilder: "exchangeOnly:USDH",
			spot: "spot:USDC",
		},
	};

	for (const [modeName, mode] of Object.entries(MODES)) {
		for (const [slot, coin] of Object.entries(markets) as [keyof typeof markets, string][]) {
			it(`${modeName} on ${coin}`, () => {
				const source = getCollateralSource(accountOf("p3-default", mode), market(coin));
				const label = "dex" in source ? `${source.kind}:${source.dex.name}` : `${source.kind}:${source.token.name}`;
				expect(label).toBe(expected[modeName][slot]);
			});
		}
	}

	it("never names USDC as collateral for a USDH dex in any mode", () => {
		for (const mode of Object.values(MODES)) {
			const source = getCollateralSource(accountOf("p3-default", mode), market("flx:NVDA"));
			const token = "dex" in source ? source.dex.collateralToken : source.token;
			expect(token.name).toBe("USDH");
		}
	});
});

describe("trade collateral", () => {
	it("explains P3's empty xyz with the USDC it holds in perps and spot", () => {
		const collateral = getTradeCollateral(
			accountOf("p3-default"),
			market("xyz:NVDA"),
			"buy",
			liveQuote("p3-default", "xyz:NVDA"),
		);
		expect(collateral).toEqual({
			status: "ready",
			source: { kind: "dex", dex: expect.objectContaining({ name: "xyz" }) },
			token: expect.objectContaining({ name: "USDC" }),
			available: "0.0",
			maxSize: "0.0",
			shortfall: {
				kind: "dexEmpty",
				dex: expect.objectContaining({ name: "xyz" }),
				token: expect.objectContaining({ name: "USDC" }),
				elsewhere: [
					{ place: { kind: "perp" }, amount: "97.617353" },
					{ place: { kind: "spot" }, amount: "36.710408" },
				],
			},
		});
	});

	it("keeps Appendix A's 73,414 spot USDC off xyz for a standard account", () => {
		const account = accountOf("p3-default");
		const withSpot: ReadyAccount = {
			...account,
			spot: { balances: [{ coin: "USDC", token: 0, total: "73414", hold: "0", entryNtl: "0" }], evmEscrows: [] },
		};
		const collateral = getTradeCollateral(withSpot, market("xyz:NVDA"), "buy", liveQuote("p3-default", "xyz:NVDA"));
		expect(collateral.status === "ready" && collateral.available).toBe("0.0");
		expect(collateral.status === "ready" && collateral.shortfall).toMatchObject({
			kind: "dexEmpty",
			elsewhere: expect.arrayContaining([{ place: { kind: "spot" }, amount: "73414" }]),
		});
	});

	it("sizes P3's main dex from the exchange with no shortfall", () => {
		const collateral = getTradeCollateral(
			accountOf("p3-default"),
			market("BTC"),
			"sell",
			liveQuote("p3-default", "BTC"),
		);
		expect(collateral).toMatchObject({ status: "ready", available: "97.617353", shortfall: null });
	});

	it("sizes a unified account's builder dex from its shared spot USDC as the exchange quotes it", () => {
		const name = "mainnet-unified-0x8c60";
		const quote = fixture(name).activeAssetData["xyz:NVDA"];
		const collateral = getTradeCollateral(accountOf(name), market("xyz:NVDA"), "sell", liveQuote(name, "xyz:NVDA"));
		expect(collateral).toMatchObject({
			status: "ready",
			source: { kind: "spot", token: { name: "USDC" } },
			available: quote.availableToTrade[1],
			maxSize: quote.maxTradeSzs[1],
			shortfall: null,
		});
	});

	it("shows funds on both dexes of a standard account with two funded dexes", () => {
		const name = "mainnet-disabled-two-dexes";
		const collateral = getTradeCollateral(accountOf(name), market("xyz:NVDA"), "buy", liveQuote(name, "xyz:NVDA"));
		expect(collateral).toMatchObject({
			status: "ready",
			source: { kind: "dex", dex: { name: "xyz" } },
			shortfall: null,
		});
	});

	it("says funds are in use when the dex holds collateral but all of it is margin", () => {
		const account = accountOf("p3-default");
		const quote = {
			...fixture("p3-default").activeAssetData.BTC,
			availableToTrade: ["0.0", "0.0"] as [string, string],
		};
		const collateral = getTradeCollateral(account, market("BTC"), "buy", { status: "live", quote, leverage: null, seen: SEEN_NOW });
		expect(collateral.status === "ready" && collateral.shortfall).toEqual({
			kind: "inUse",
			token: expect.objectContaining({ name: "USDC" }),
		});
	});

	it("names no funds when the token is nowhere in the account", () => {
		const account = accountOf("p3-default");
		if (account.ledger !== "perDex") throw new Error("P3 is standard");
		const empty: ReadyAccount = {
			...account,
			spot: { balances: [], evmEscrows: [] },
			dexes: new Map([...account.dexes].map(([dex, state]) => [dex, { ...state, withdrawable: "0.0" }])),
		};
		const quote = fixture("p3-default").activeAssetData["xyz:NVDA"];
		const collateral = getTradeCollateral(empty, market("xyz:NVDA"), "buy", { status: "live", quote, leverage: null, seen: SEEN_NOW });
		expect(collateral.status === "ready" && collateral.shortfall?.kind).toBe("noFunds");
	});

	it("uses spot balances by side on a spot market", () => {
		const account = accountOf("p3-default");
		expect(getTradeCollateral(account, market("@107"), "buy", { status: "waiting" })).toMatchObject({
			status: "ready",
			token: { name: "USDC" },
			available: "36.710408",
			shortfall: null,
		});
		expect(getTradeCollateral(account, market("@107"), "sell", { status: "waiting" })).toMatchObject({
			status: "ready",
			token: { name: "HYPE" },
			available: "0",
			shortfall: { kind: "noFunds" },
		});
	});
});

describe("an activeAssetData quote counts only for this ticket", () => {
	const account = accountOf("p3-default");
	const nvda = fixture("p3-default").activeAssetData["xyz:NVDA"];

	it.each<[string, AccountState, QuoteCheck]>([
		["the account has not loaded", { status: "loading" }, { status: "live", quote: nvda, leverage: null, seen: SEEN_NOW }],
		["no quote has arrived for this generation", account, { status: "waiting" }],
		[
			"the quote is for another dex's NVDA",
			account,
			{ status: "live", quote: { ...nvda, coin: "io:NVDA" }, leverage: null, seen: SEEN_NOW },
		],
		[
			"the quote is for another wallet",
			account,
			{ status: "live", quote: { ...nvda, user: "0x9fed7c631d8d525ce642402c0e36a73cf5c77c1c" }, leverage: null, seen: SEEN_NOW },
		],
		[
			"the quote predates the leverage just applied",
			account,
			{ status: "live", quote: nvda, leverage: { type: "isolated", value: 20, rawUsd: "0" }, seen: SEEN_NOW },
		],
		[
			"the quote has the old leverage value",
			account,
			{ status: "live", quote: nvda, leverage: { type: "cross", value: 5 }, seen: SEEN_NOW },
		],
	])("is pending when %s", (_label, state, check) => {
		expect(getTradeCollateral(state, market("xyz:NVDA"), "buy", check).status).toBe("pending");
	});

	it("matches the wallet case-insensitively and accepts the leverage it was sent", () => {
		const check: QuoteCheck = { status: "live", quote: nvda, leverage: { type: "cross", value: 20 }, seen: SEEN_NOW };
		const upper = { ...account, user: account.user.toUpperCase().replace("0X", "0x") };
		expect(getTradeCollateral(upper, market("xyz:NVDA"), "buy", check).status).toBe("ready");
	});
});

describe("transfer limits", () => {
	it.each(["p3-default", "p1-disabled"])(
		"%s: perp to spot equals the exchange's BTC available on a flat account",
		(name) => {
			const captured = fixture(name);
			const limit = getTransferLimit(accountOf(name), "perpToSpot");
			expect(limit.status).toBe("ready");
			if (limit.status !== "ready") return;
			expect(Big(limit.amount).minus(captured.activeAssetData.BTC.availableToTrade[0]).abs().lte("0.000001")).toBe(
				true,
			);
		},
	);

	it("has no verified perp and spot limit on a unified account", () => {
		const account = accountOf("mainnet-unified-0x8c60");
		expect(getTransferLimit(account, "perpToSpot")).toEqual({ status: "unverifiedTransferLimit" });
		expect(getTransferLimit(account, "spotToPerp")).toEqual({ status: "unverifiedTransferLimit" });
		expect(getTransferLimit(accountOf("p3-default", MODES.portfolio), "perpToSpot")).toEqual({
			status: "unverifiedTransferLimit",
		});
	});

	it("withdraws a unified account's spot USDC after maintenance", () => {
		expect(getTransferLimit(accountOf("mainnet-unified-0x8c60"), "withdraw")).toEqual({
			status: "ready",
			amount: "66207.01836979",
		});
	});

	it("is pending while the account loads", () => {
		expect(getTransferLimit({ status: "loading" }, "withdraw")).toEqual({ status: "pending" });
	});
});
