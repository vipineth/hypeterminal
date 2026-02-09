import { describe, expect, it } from "vitest";
import { estimatePayloadSizeBytes, isPayloadOversized } from "@/lib/websocket/payload-guard";
import { getPayloadLimitBytesForSubscriptionKey, WS_RELIABILITY_LIMITS } from "@/lib/websocket/reliability";

describe("websocket payload guard", () => {
	it("estimates payload size for nested structures", () => {
		const payload = {
			coin: "BTC",
			levels: [
				{ px: "100000.1", sz: "2.1" },
				{ px: "100000.2", sz: "2.2" },
			],
		};

		const size = estimatePayloadSizeBytes(payload);
		expect(size).toBeGreaterThan(0);
	});

	it("flags oversized payloads", () => {
		const payload = { blob: "x".repeat(4096) };
		const result = isPayloadOversized(payload, 512);
		expect(result.oversized).toBe(true);
		expect(result.estimatedBytes).toBeGreaterThan(512);
	});

	it("maps subscription key to payload limit", () => {
		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "BTC" }]);
		const limit = getPayloadLimitBytesForSubscriptionKey(key);
		expect(limit).toBe(WS_RELIABILITY_LIMITS.payload.perMethodMaxBytes.l2Book);
	});

	it("falls back to default payload limit for unknown key", () => {
		const limit = getPayloadLimitBytesForSubscriptionKey("not-json");
		expect(limit).toBe(WS_RELIABILITY_LIMITS.payload.defaultMaxBytes);
	});
});
