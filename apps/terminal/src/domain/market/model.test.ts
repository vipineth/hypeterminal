import { readFileSync } from "node:fs";
import type { IRequestTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";
import { describe, expect, it } from "vitest";
import { getMarketCapabilities } from "@/domain/market/capabilities";
import { getPositionDex } from "@/domain/market/dex";
import {
	getDefaultLeverage,
	isPerpLike,
	type Market,
	type MetaPayloads,
	type ParseIssue,
	type PerpMarket,
	parseMarkets,
} from "@/domain/market/model";

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);
const tokenByIndex = new Map(snapshot.spotMeta.tokens.map((token) => [token.index, token]));

function copySnapshot(): MetaPayloads {
	return structuredClone(snapshot);
}

function dexSlot(name: string): number {
	return snapshot.perpDexs.findIndex((dex) => dex?.name === name);
}

function spot(name: string) {
	const market = model.byName.get(name);
	if (market?.kind !== "spot") throw new Error(`${name} is not a parsed spot market`);
	return market;
}

function perp(name: string) {
	const market = model.byName.get(name);
	if (!market || !isPerpLike(market)) throw new Error(`${name} is not a parsed perp market`);
	return market;
}

function issuesOf(kind: ParseIssue["kind"], issues: readonly ParseIssue[]) {
	return issues.filter((issue) => issue.kind === kind);
}

function fixtureTransport(): IRequestTransport {
	return {
		isTestnet: false,
		async request(_endpoint, payload) {
			const { type, dex } = payload as { type: string; dex?: string };
			if (type === "meta") return snapshot.allPerpMetas[dex ? dexSlot(dex) : 0];
			if (type === "spotMeta") return snapshot.spotMeta;
			if (type === "perpDexs") return snapshot.perpDexs;
			if (type === "outcomeMeta") return { outcomes: [], questions: [] };
			throw new Error(`unexpected info request ${type}`);
		},
	} as IRequestTransport;
}

describe("parseMarkets on the committed mainnet snapshot", () => {
	it("records no issues on live data", () => {
		expect(model.issues).toEqual([]);
	});

	it("resolves every spot pair's tokens by token.index, not array position", () => {
		const unresolved = snapshot.spotMeta.universe.filter((pair) => {
			const market = model.byName.get(pair.name);
			if (market?.kind !== "spot") return true;
			return (
				market.base.index !== pair.tokens[0] ||
				market.quote.index !== pair.tokens[1] ||
				market.szDecimals !== tokenByIndex.get(pair.tokens[0])?.szDecimals
			);
		});

		expect(unresolved.map((pair) => pair.name)).toEqual([]);
		expect(model.markets.filter((market) => market.kind === "spot")).toHaveLength(snapshot.spotMeta.universe.length);
	});

	it("maps the pairs today's positional lookup gets wrong", () => {
		expect([spot("@367").base.name, spot("@367").szDecimals]).toEqual(["WARS", 2]);
		expect([spot("@590").base.name, spot("@590").szDecimals]).toEqual(["SPCX", 4]);
		expect(spot("@496").base.name).toBe("ONEAR");
		expect(spot("@701").base.name).toBe("WBRL");
		expect(spot("@465").base.name).toBe("SPCXD");
		expect(spot("@497").base.name).toBe("MGW");
		expect(spot("@591").base.name).toBe("MAX");
		expect(spot("PURR/USDC").assetId).toBe(10000);
		expect(spot("@107").assetId).toBe(10107);
	});

	it("agrees with the SDK SymbolConverter on every asset id and szDecimals, delisted perps included", async () => {
		const converter = await SymbolConverter.create({ transport: fixtureTransport(), dexs: true });
		const mismatches = model.markets.flatMap((market) => {
			const key = market.kind === "spot" ? converter.getSymbolBySpotPairId(market.name) : market.name;
			if (key === undefined) return [`${market.name}: unknown to the SDK`];
			const actual = { assetId: market.assetId, szDecimals: market.szDecimals };
			const expected = { assetId: converter.getAssetId(key), szDecimals: converter.getSzDecimals(key) };
			return actual.assetId === expected.assetId && actual.szDecimals === expected.szDecimals
				? []
				: [`${market.name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`];
		});
		const spotKeys = model.markets.flatMap((market) =>
			market.kind === "spot" ? [{ name: market.name, key: `${market.base.name}/${market.quote.name}` }] : [],
		);
		const perpCount = snapshot.allPerpMetas.reduce((sum, meta) => sum + meta.universe.length, 0);

		expect(mismatches).toEqual([]);
		expect(spotKeys.filter(({ name, key }) => converter.getSymbolBySpotPairId(name) !== key)).toEqual([]);
		expect(model.markets).toHaveLength(perpCount + snapshot.spotMeta.universe.length);
	});

	it("numbers HIP-3 markets by dex slot and universe position", () => {
		expect(perp("xyz:NVDA").assetId).toBe(110002);
		expect(perp("io:NVDA").assetId).toBe(200014);
	});

	it("lists only the live NVDA listings and keeps the delisted ones by full coin", () => {
		const nvda = model.markets.filter((market) => market.shortName === "NVDA");

		expect(model.listed.filter((market) => market.shortName === "NVDA").map((market) => market.name)).toEqual([
			"xyz:NVDA",
			"io:NVDA",
		]);
		expect(nvda.filter((market) => market.isDelisted).map((market) => market.name)).toEqual(
			expect.arrayContaining(["flx:NVDA", "km:NVDA", "cash:NVDA", "mkts:NVDA"]),
		);
		expect(model.byName.get("NVDA-USDC")).toBeUndefined();
	});

	it("keeps each delisted perp at its universe position", () => {
		const shifted = snapshot.allPerpMetas.flatMap((meta, slot) =>
			meta.universe.flatMap((asset, position) => {
				const expected = slot === 0 ? position : 100000 + slot * 10000 + position;
				const market = model.byName.get(asset.name);
				return market?.assetId === expected && market.isDelisted === (asset.isDelisted === true) ? [] : [asset.name];
			}),
		);

		expect(shifted).toEqual([]);
	});

	it("parses the same markets when the token array is reversed", () => {
		const reversed = copySnapshot();
		reversed.spotMeta.tokens.reverse();

		expect(parseMarkets(reversed).markets).toEqual(model.markets);
	});

	it("resolves every dex's collateral by token.index when the token array is reversed", () => {
		const reversed = copySnapshot();
		reversed.spotMeta.tokens.reverse();
		const collateral = Object.fromEntries(
			parseMarkets(reversed).dexes.map((dex) => [dex.name || "main", dex.collateralToken.name]),
		);

		expect(collateral).toEqual({
			main: "USDC",
			xyz: "USDC",
			flx: "USDH",
			vntl: "USDH",
			hyna: "USDE",
			km: "USDH",
			abcd: "USDC",
			cash: "USDT0",
			para: "USDC",
			mkts: "USDC",
			io: "USDC",
		});
	});

	it("resolves a builder collateral index past the token gaps by token.index", () => {
		const moved = copySnapshot();
		moved.allPerpMetas[dexSlot("xyz")].collateralToken = 479;
		const nvda = perp(`xyz:NVDA`);
		const movedNvda = parseMarkets(moved).byName.get(nvda.name);

		expect(snapshot.spotMeta.tokens[479].name).toBe("SPCXX");
		expect(movedNvda?.quote.name).toBe("WARS");
		expect(movedNvda?.kind !== "spot" && movedNvda?.dex.collateralToken.name).toBe("WARS");
	});

	it("quotes every perp in its dex collateral", () => {
		expect(model.markets.filter((market) => isPerpLike(market) && market.quote !== market.dex.collateralToken)).toEqual(
			[],
		);
		expect(perp("BTC").quote.name).toBe("USDC");
		expect(perp("BTC").pairName).toBe("BTC-USDC");
		expect(perp("flx:NVDA").pairName).toBe("NVDA-USDH");
	});
});

describe("margin policy", () => {
	it("allows cross only when the normalized margin mode is unset", () => {
		const perps = model.markets.filter(isPerpLike);
		expect(perps.filter((market) => market.crossAllowed !== (market.marginMode === undefined))).toEqual([]);
		expect(perps.filter((market) => market.crossAllowed && market.marginMode !== undefined)).toEqual([]);
	});

	it("matches the raw SDK margin fields for every xyz asset", () => {
		const xyz = snapshot.allPerpMetas[dexSlot("xyz")].universe;
		const wrong = xyz.filter((asset) => {
			const restricted = asset.marginMode !== undefined || asset.onlyIsolated === true;
			return perp(asset.name).crossAllowed === restricted;
		});

		expect(wrong.map((asset) => asset.name)).toEqual([]);
		expect(xyz.some((asset) => asset.marginMode === "noCross")).toBe(true);
		expect(perp("xyz:NVDA").crossAllowed).toBe(true);
	});

	it("maps legacy onlyIsolated to noCross and records an unknown mode as no-cross", () => {
		const legacy = copySnapshot();
		const asset = legacy.allPerpMetas[0].universe[0];
		delete asset.marginMode;
		asset.onlyIsolated = true;
		legacy.allPerpMetas[0].universe[1].marginMode = "crossOnly" as never;
		const parsed = parseMarkets(legacy);
		const first = parsed.byName.get(asset.name);
		const second = parsed.byName.get(legacy.allPerpMetas[0].universe[1].name);

		expect(first?.kind === "perp" && [first.marginMode, first.crossAllowed]).toEqual(["noCross", false]);
		expect(second?.kind === "perp" && second.crossAllowed).toBe(false);
		expect(issuesOf("unknownMarginMode", parsed.issues)).toEqual([
			{ kind: "unknownMarginMode", coin: legacy.allPerpMetas[0].universe[1].name, marginMode: "crossOnly" },
		]);
	});

	it("feeds capabilities from crossAllowed", () => {
		const noCross = model.markets.find((market) => isPerpLike(market) && market.marginMode === "noCross");

		expect(getMarketCapabilities(noCross).allowsCrossMargin).toBe(false);
		expect(getMarketCapabilities(perp("xyz:NVDA")).allowsCrossMargin).toBe(true);
		expect(getMarketCapabilities(spot("@107")).isLeveraged).toBe(false);
	});
});

describe("parse issues instead of silent guesses", () => {
	it("drops the markets of a dex whose collateral token is missing and reports each", () => {
		const missing = copySnapshot();
		missing.spotMeta.tokens = missing.spotMeta.tokens.filter((token) => token.index !== 360);
		const parsed = parseMarkets(missing);
		const usdhPairs = snapshot.spotMeta.universe.filter((pair) => pair.tokens.includes(360));

		expect(issuesOf("collateralMissing", parsed.issues)).toEqual([
			{ kind: "collateralMissing", dex: "flx", tokenIndex: 360 },
			{ kind: "collateralMissing", dex: "vntl", tokenIndex: 360 },
			{ kind: "collateralMissing", dex: "km", tokenIndex: 360 },
		]);
		expect(parsed.markets.filter((market) => /^(flx|vntl|km):/.test(market.name))).toEqual([]);
		expect(issuesOf("spotTokenMissing", parsed.issues)).toHaveLength(usdhPairs.length);
		expect(usdhPairs.filter((pair) => parsed.byName.has(pair.name))).toEqual([]);
	});

	it("rejects a builder dex whose slot does not line up with its meta", () => {
		const shifted = copySnapshot();
		shifted.perpDexs[dexSlot("xyz")] = null;
		const parsed = parseMarkets(shifted);

		expect(issuesOf("dexSlotMismatch", parsed.issues)).toEqual([
			{ kind: "dexSlotMismatch", dexIndex: dexSlot("xyz"), dex: null },
		]);
		expect(parsed.byName.has("xyz:NVDA")).toBe(false);
		expect(parsed.byName.get("io:NVDA")?.assetId).toBe(200014);
	});

	it("rejects a builder asset without its dex prefix", () => {
		const renamed = copySnapshot();
		renamed.allPerpMetas[dexSlot("io")].universe[14].name = "xyz:NVDA2";
		const parsed = parseMarkets(renamed);

		expect(issuesOf("assetPrefixMismatch", parsed.issues)).toEqual([
			{ kind: "assetPrefixMismatch", dex: "io", coin: "xyz:NVDA2" },
		]);
		expect(parsed.byName.has("xyz:NVDA2")).toBe(false);
	});

	it("reports a missing dex meta and keeps the dexes before it", () => {
		const short = copySnapshot();
		short.allPerpMetas.pop();
		const parsed = parseMarkets(short);

		expect(issuesOf("dexMetaMissing", parsed.issues)).toEqual([
			{ kind: "dexMetaMissing", dexIndex: snapshot.perpDexs.length - 1 },
		]);
		expect(parsed.byName.get("xyz:NVDA")?.assetId).toBe(110002);
	});

	it("rejects duplicate token indices, coins and asset ids", () => {
		const duplicated = copySnapshot();
		const wars = duplicated.spotMeta.tokens.find((token) => token.index === 479);
		if (!wars) throw new Error("fixture lost WARS");
		duplicated.spotMeta.tokens.push({ ...wars, name: "FAKE" });
		const btc = duplicated.allPerpMetas[0].universe[0];
		duplicated.allPerpMetas[0].universe.push({ ...btc });
		const pair = duplicated.spotMeta.universe[1];
		duplicated.spotMeta.universe.push({ ...pair, name: "@dup" });
		const parsed = parseMarkets(duplicated);

		expect(issuesOf("duplicateTokenIndex", parsed.issues)).toEqual([{ kind: "duplicateTokenIndex", tokenIndex: 479 }]);
		expect(parsed.tokenByIndex.get(479)?.name).toBe("WARS");
		expect(issuesOf("duplicateCoin", parsed.issues)).toEqual([{ kind: "duplicateCoin", coin: btc.name }]);
		expect(parsed.byName.get(btc.name)?.assetId).toBe(0);
		expect(issuesOf("duplicateAssetId", parsed.issues)).toEqual([
			{ kind: "duplicateAssetId", coin: "@dup", assetId: 10000 + pair.index },
		]);
	});

	it("never lets a wrapped display name shadow a real token name", () => {
		const shadowed = model.tokens.filter((token) => model.tokenByName.get(token.name) !== token);

		expect(shadowed).toEqual([]);
	});
});

describe("types", () => {
	it("keeps spot markets free of perp fields and asset ids minted only by the parser", () => {
		const btc = perp("BTC");
		const market: Market = spot("@107");
		// @ts-expect-error spot markets have no leverage
		market.maxLeverage;
		// @ts-expect-error asset ids are minted only by parseMarkets
		const forged: PerpMarket = { ...btc, kind: "perp", assetId: 5 };

		expect(forged.assetId).toBe(5);
	});
});

describe("leverage", () => {
	it("defaults to 10x capped at the market max, 1x on spot", () => {
		expect(getDefaultLeverage(perp("BTC"))).toBe(Math.min(10, perp("BTC").maxLeverage));
		expect(
			getDefaultLeverage(model.markets.find((market) => isPerpLike(market) && market.maxLeverage < 10)),
		).toBeLessThan(10);
		expect(getDefaultLeverage(spot("@107"))).toBe(1);
		expect(getDefaultLeverage(undefined)).toBe(10);
	});

	it("checks positions on the market's own dex", () => {
		expect(getPositionDex(perp("BTC"))).toBe("");
		expect(getPositionDex(perp("xyz:NVDA"))).toBe("xyz");
		expect(getPositionDex(spot("@107"))).toBeUndefined();
	});
});
