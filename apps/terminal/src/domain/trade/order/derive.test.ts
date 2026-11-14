import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { deriveOrderEntry, type OrderEntryInputs } from "@/domain/trade/order/derive";

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);

function entryFor(coin: string) {
	const inputs: OrderEntryInputs = {
		isConnected: false,
		market: model.byName.get(coin),
		side: "buy",
		conversionPrice: 0,
		sizeMode: "base",
		size: "",
		sizeUnit: null,
		spotBalances: null,
		maxTradeSzs: null,
		availableToTrade: null,
	};
	return deriveOrderEntry(inputs);
}

describe("ticket asset label", () => {
	it("names the dex of a builder perp so two listings never read alike", () => {
		expect(entryFor("io:NVDA").assetLabel).toBe("io:NVDA");
		expect(entryFor("xyz:NVDA").assetLabel).toBe("xyz:NVDA");
	});

	it("keeps the short name for main perps and the base token for spot", () => {
		expect(entryFor("BTC").assetLabel).toBe("BTC");
		expect(entryFor("@107").assetLabel).toBe("HYPE");
	});
});

describe("builder perp collateral on a standard account", () => {
	it("never reads spot USDC as xyz margin", () => {
		const entry = deriveOrderEntry({
			isConnected: true,
			market: model.byName.get("xyz:NVDA"),
			side: "buy",
			conversionPrice: 171.07,
			sizeMode: "base",
			size: "",
			sizeUnit: null,
			spotBalances: [{ coin: "USDC", token: 0, total: "73414", hold: "0", entryNtl: "0" }],
			maxTradeSzs: [0, 0],
			availableToTrade: [0, 0],
		});

		expect(entry.availableBalance).toBe(0);
		expect(entry.spotBalance.quoteAvailable).toBe(0);
	});
});
