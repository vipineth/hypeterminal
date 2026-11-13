import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildLiveCases, checkCase, type LiveMetaSnapshot, listLiveMarkets } from "@/domain/trade/live-plan-set";
import { buildOrderPlan } from "@/domain/trade/order-intent";

const snapshot: LiveMetaSnapshot = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const markets = listLiveMarkets(snapshot);
const cases = buildLiveCases(snapshot);
const labels = [...new Set(cases.map((planCase) => planCase.label))];

describe(`live mainnet meta from ${snapshot.fetchedAt}`, () => {
	it(`covers ${markets.length} live markets with ${cases.length} plans`, () => {
		expect(markets.filter((market) => market.kind !== "spot").length).toBeGreaterThanOrEqual(300);
		expect(markets.filter((market) => market.kind === "spot").length).toBeGreaterThanOrEqual(300);
		expect(cases.length).toBeGreaterThanOrEqual(700);
	});

	it.each(labels)("%s: every market and side passes tick, lot and order kind rules", (label) => {
		const labelCases = cases.filter((planCase) => planCase.label === label);
		const violations = labelCases.flatMap((planCase) => checkCase(planCase, buildOrderPlan(planCase.intent)));
		expect({ plans: labelCases.length, violations: violations.length, first: violations.slice(0, 5) }).toEqual({
			plans: labelCases.length,
			violations: 0,
			first: [],
		});
	});
});
