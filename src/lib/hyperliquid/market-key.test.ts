import { describe, expect, it } from "vitest";
import { isPerpMarketKey, makePerpMarketKey, marketKindFromMarketKey, perpCoinFromMarketKey } from "./market-key";

describe("market-key", () => {
	it("builds and parses perp market keys", () => {
		const key = makePerpMarketKey("BTC");
		expect(key).toBe("perp:BTC");
		expect(isPerpMarketKey(key)).toBe(true);
		expect(perpCoinFromMarketKey(key)).toBe("BTC");
	});

	it("infers market kind from key", () => {
		expect(marketKindFromMarketKey("perp:ETH")).toBe("perp");
		expect(marketKindFromMarketKey("spot:ETH")).toBe("spot");
		expect(marketKindFromMarketKey("perpDex:ABC")).toBe("builderPerp");
		expect(marketKindFromMarketKey("nope")).toBeNull();
	});
});
