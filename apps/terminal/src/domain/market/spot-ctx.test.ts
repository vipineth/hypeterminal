import { describe, expect, it } from "vitest";
import { findSpotCtx } from "@/domain/market/spot-ctx";
import { spotMarket } from "@/test/markets";
import type { SpotAssetCtx } from "@/types/hyperliquid";

function ctx(coin: string | undefined, markPx: string): SpotAssetCtx {
	return { coin, markPx } as SpotAssetCtx;
}

describe("findSpotCtx", () => {
	const purr = spotMarket(10001, 0, "PURR");

	it("uses the ctx at the pair index when its coin matches", () => {
		expect(findSpotCtx([ctx("@0", "1"), ctx("@1", "2")], purr)?.markPx).toBe("2");
	});

	it("never merges another pair's ctx when the index holds a different coin", () => {
		expect(findSpotCtx([ctx("@1", "2"), ctx("@7", "9")], purr)?.markPx).toBe("2");
		expect(findSpotCtx([ctx("@0", "1"), ctx("@7", "9")], purr)).toBeUndefined();
	});

	it("uses the ctx at the pair index when the feed omits the coin", () => {
		expect(findSpotCtx([ctx(undefined, "1"), ctx(undefined, "2")], purr)?.markPx).toBe("2");
	});
});
