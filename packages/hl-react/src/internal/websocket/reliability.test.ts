import { describe, expect, it } from "vitest";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import { estimatePayloadSizeBytes, isPayloadOversized } from "./payload-guard";
import { getPayloadLimitBytesForSubscriptionKey } from "./reliability";

const spotAssetCtxsKey = serializeKey(subscriptionKeys.method("spotAssetCtxs", undefined));

function spotCtx(index: number) {
	return {
		prevDayPx: "0.090756",
		dayNtlVlm: "1053240.5337350001",
		markPx: "0.092603",
		midPx: "0.0926035",
		circulatingSupply: "594642677.2693300247",
		coin: `@${index}`,
		totalSupply: "594642688.5758500099",
		dayBaseVlm: "11507081.0",
	};
}

function spotCtxsOverBytes(minBytes: number) {
	const ctxs = [];
	while (estimatePayloadSizeBytes(ctxs) <= minBytes) {
		for (let i = 0; i < 16; i += 1) ctxs.push(spotCtx(ctxs.length));
	}
	return ctxs;
}

function keeps(key: string, payload: unknown) {
	return !isPayloadOversized(payload, getPayloadLimitBytesForSubscriptionKey(key)).oversized;
}

describe("subscription payload limits", () => {
	it("keeps a spotAssetCtxs update just over 256 KB", () => {
		const payload = spotCtxsOverBytes(256 * 1024);
		expect(estimatePayloadSizeBytes(payload)).toBeGreaterThan(256 * 1024);
		expect(keeps(spotAssetCtxsKey, payload)).toBe(true);
	});

	it("still drops a spotAssetCtxs update over its own limit", () => {
		const payload = spotCtxsOverBytes(getPayloadLimitBytesForSubscriptionKey(spotAssetCtxsKey));
		expect(keeps(spotAssetCtxsKey, payload)).toBe(false);
	});
});
