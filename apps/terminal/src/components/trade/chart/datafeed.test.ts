import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createDatafeed } from "@/components/trade/chart/datafeed";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import type { LibrarySymbolInfo } from "@/types/charting_library";

vi.mock("@/lib/hyperliquid", () => ({
	getInfoClient: () => ({ allMids: async () => ({}) }),
}));

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);
const datafeed = createDatafeed((coin) => model.byName.get(coin));

function resolve(coin: string): Promise<LibrarySymbolInfo> {
	return new Promise((onResolve, onError) => datafeed.resolveSymbol(coin, onResolve, onError, undefined));
}

describe("chart symbol labels", () => {
	it("labels a spot chart with the pair's own quote and keeps the coin as ticker", async () => {
		expect(await resolve("@232")).toMatchObject({ name: "HYPE/USDH", description: "HYPE/USDH", ticker: "@232" });
		expect(await resolve("PURR/USDC")).toMatchObject({ name: "PURR/USDC", ticker: "PURR/USDC" });
		expect(await resolve("@142")).toMatchObject({ name: "BTC/USDC", ticker: "@142" });
	});

	it("keeps the dex on a builder perp label", async () => {
		expect(await resolve("xyz:NVDA")).toMatchObject({ ticker: "xyz:NVDA" });
		expect((await resolve("xyz:NVDA")).name).not.toBe((await resolve("io:NVDA")).name);
	});

	it("gives every listed market its own chart label", async () => {
		const labels = await Promise.all(model.listed.map(async (market) => (await resolve(market.name)).name));

		expect(labels.filter((label, index) => labels.indexOf(label) !== index)).toEqual([]);
	});
});
