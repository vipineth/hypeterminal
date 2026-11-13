import { readFileSync } from "node:fs";
import type { IRequestTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";
import { describe, expect, it } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);
const tokenByIndex = new Map(snapshot.spotMeta.tokens.map((token) => [token.index, token]));

function copySnapshot(): MetaPayloads {
	return structuredClone(snapshot);
}

function spot(name: string) {
	const market = model.byName.get(name);
	if (market?.kind !== "spot") throw new Error(`${name} is not a parsed spot market`);
	return market;
}

function duplicates(labels: string[]) {
	return labels.filter((label, i) => labels.indexOf(label) !== i);
}

function fixtureTransport(): IRequestTransport {
	return {
		isTestnet: false,
		async request(_endpoint, payload) {
			const { type, dex } = payload as { type: string; dex?: string };
			if (type === "meta") {
				const dexIndex = dex ? snapshot.perpDexs.findIndex((entry) => entry?.name === dex) : 0;
				return snapshot.allPerpMetas[dexIndex];
			}
			if (type === "spotMeta") return snapshot.spotMeta;
			if (type === "perpDexs") return snapshot.perpDexs;
			if (type === "outcomeMeta") return { outcomes: [], questions: [] };
			throw new Error(`unexpected info request ${type}`);
		},
	} as IRequestTransport;
}

describe("parseMarkets on the committed mainnet snapshot", () => {
	it("resolves every spot pair's tokens by token.index, not array position", () => {
		const unresolved = snapshot.spotMeta.universe.filter((pair) => {
			const market = model.byName.get(pair.name);
			if (market?.kind !== "spot") return true;
			const base = tokenByIndex.get(pair.tokens[0]);
			return (
				market.tokensInfo[0]?.index !== pair.tokens[0] ||
				market.tokensInfo[1]?.index !== pair.tokens[1] ||
				market.szDecimals !== base?.szDecimals
			);
		});

		expect(unresolved.map((pair) => pair.name)).toEqual([]);
		expect(model.spot).toHaveLength(snapshot.spotMeta.universe.length);
	});

	it("maps the pairs today's positional lookup gets wrong", () => {
		expect([spot("@367").tokensInfo[0].name, spot("@367").szDecimals]).toEqual(["WARS", 2]);
		expect([spot("@590").tokensInfo[0].name, spot("@590").szDecimals]).toEqual(["SPCX", 4]);
		expect(spot("@496").tokensInfo[0].name).toBe("ONEAR");
		expect(spot("@701").tokensInfo[0].name).toBe("WBRL");
		expect(spot("@465").tokensInfo[0].name).toBe("SPCXD");
		expect(spot("@497").tokensInfo[0].name).toBe("MGW");
		expect(spot("@591").tokensInfo[0].name).toBe("MAX");
		expect(spot("PURR/USDC").assetId).toBe(10000);
		expect(spot("@107").assetId).toBe(10107);
	});

	it("agrees with the SDK SymbolConverter on every asset id and szDecimals", async () => {
		const converter = await SymbolConverter.create({ transport: fixtureTransport(), dexs: true });
		const mismatches = model.all.flatMap((market) => {
			const key = market.kind === "spot" ? converter.getSymbolBySpotPairId(market.name) : market.name;
			if (key === undefined) return [`${market.name}: unknown to the SDK`];
			const actual = { assetId: market.assetId, szDecimals: market.szDecimals };
			const expected = { assetId: converter.getAssetId(key), szDecimals: converter.getSzDecimals(key) };
			return actual.assetId === expected.assetId && actual.szDecimals === expected.szDecimals
				? []
				: [`${market.name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`];
		});
		const spotKeys = model.spot.map((market) => ({
			name: market.name,
			key: `${market.tokensInfo[0].name}/${market.tokensInfo[1].name}`,
		}));

		expect(mismatches).toEqual([]);
		expect(spotKeys.filter(({ name, key }) => converter.getSymbolBySpotPairId(name) !== key)).toEqual([]);
		expect(model.spot).toHaveLength(snapshot.spotMeta.universe.length);
	});

	it("gives every listed spot market and token its own label", () => {
		expect(duplicates(model.spot.map((market) => market.pairName))).toEqual([]);
		expect(duplicates(model.tokens.map((token) => token.displayName))).toEqual([]);
	});

	it("keeps the U on a Unit token whose stripped name belongs to another token", () => {
		expect([spot("@699").pairName, spot("@699").tokensInfo[0].name]).toEqual(["UANSEM/USDC", "UANSEM"]);
		expect([spot("@18").pairName, spot("@18").tokensInfo[0].name]).toEqual(["ANSEM/USDC", "ANSEM"]);
		expect([spot("@189").pairName, spot("@703").pairName]).toEqual(["USPYX/USDC", "SPYX/USDC"]);
		expect([spot("@188").pairName, spot("@20").pairName]).toEqual(["UPUMP/USDC", "PUMP/USDC"]);
		expect(spot("@142").pairName).toBe("BTC/USDC");
	});

	it("resolves every token by its real name to itself", () => {
		const misresolved = model.tokens.filter((token) => model.tokenByName.get(token.name)?.index !== token.index);

		expect(misresolved.map((token) => token.name)).toEqual([]);
	});

	it("numbers HIP-3 markets by dex slot and universe position", () => {
		expect(model.byName.get("xyz:NVDA")?.assetId).toBe(110002);
		expect(model.byName.get("io:NVDA")?.assetId).toBe(200014);
	});

	it("parses the same markets when the token array is reversed", () => {
		const reversed = copySnapshot();
		reversed.spotMeta.tokens.reverse();

		expect(parseMarkets(reversed).all).toEqual(model.all);
	});

	it("resolves every builder dex quote by token.index when the array is reversed", () => {
		const reversed = copySnapshot();
		reversed.spotMeta.tokens.reverse();
		const quotes = new Map(parseMarkets(reversed).builderPerp.map((market) => [market.dex, market.quoteToken?.name]));

		expect(Object.fromEntries(quotes)).toEqual({ xyz: "USDC", para: "USDC", mkts: "USDC", io: "USDC" });
	});

	it("resolves a builder collateral index past the token gaps by token.index", () => {
		const moved = copySnapshot();
		const xyz = snapshot.perpDexs.findIndex((dex) => dex?.name === "xyz");
		moved.allPerpMetas[xyz].collateralToken = 479;
		const quote = parseMarkets(moved).byName.get("xyz:NVDA");

		expect(snapshot.spotMeta.tokens[479].name).toBe("SPCXX");
		expect(quote?.kind === "builderPerp" && quote.quoteToken?.name).toBe("WARS");
	});
});
