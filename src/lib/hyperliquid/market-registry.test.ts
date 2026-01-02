import { describe, expect, it } from "vitest";
import { buildPerpMarketRegistry } from "./market-registry";

describe("market-registry", () => {
	it("builds registry maps from meta", () => {
		const meta = {
			universe: [
				{ name: "BTC", szDecimals: 3, maxLeverage: 50 },
				{ name: "ETH", szDecimals: 4, maxLeverage: 25, isDelisted: true },
			],
		};

		const registry = buildPerpMarketRegistry(meta);
		expect(registry.marketKeys).toEqual(["perp:BTC", "perp:ETH"]);
		expect(registry.coinToInfo.get("BTC")?.assetIndex).toBe(0);
		expect(registry.coinToInfo.get("ETH")?.isDelisted).toBe(true);
		expect(registry.assetIndexToCoin[1]).toBe("ETH");
	});
});
