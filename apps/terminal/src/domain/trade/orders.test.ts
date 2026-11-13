import Big from "big.js";
import { describe, expect, it } from "vitest";
import { SCALE_LEVELS_MAX, SCALE_LEVELS_MIN } from "@/config/trade";
import { getMarketPrice } from "@/domain/trade/order/price";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import {
	buildOrders,
	formatPriceForOrder,
	formatSizeForOrder,
	getDefaultLeverage,
	ORDER_PLAN_ERRORS,
} from "@/domain/trade/orders";

const ENTRY_BASE = {
	kind: "entry" as const,
	assetId: 0,
	side: "buy" as const,
	orderType: "market" as const,
	sizeValue: 1.5,
	szDecimals: 3,
	marketKind: "perp" as const,
	markPx: 100,
	slippageBps: 50,
	reduceOnly: false,
	tif: "Gtc" as const,
	limitPriceInput: "",
	triggerPriceInput: "",
	scaleStartPriceInput: "",
	scaleEndPriceInput: "",
	scaleLevelsNum: null,
	tpSlEnabled: false,
	canUseTpSl: false,
	tpPriceInput: "",
	slPriceInput: "",
};

describe("getMarketPrice (characterization)", () => {
	it("applies positive slippage for market buy", () => {
		expect(getMarketPrice("buy", 100, 50)).toBe(100.5);
	});
	it("applies negative slippage for market sell", () => {
		expect(getMarketPrice("sell", 100, 50)).toBe(99.5);
	});
	it("returns mark price when slippage is zero", () => {
		expect(getMarketPrice("buy", 100, 0)).toBe(100);
	});
});

describe("buildOrderPlan entry (characterization)", () => {
	it("builds a market buy with FrontendMarket tif and slippage-adjusted price", () => {
		const plan = buildOrderPlan(ENTRY_BASE);
		expect(plan).toEqual({
			orders: [{ a: 0, b: true, p: "100.5", s: "1.5", r: false, t: { limit: { tif: "FrontendMarket" } } }],
			grouping: "na",
			errors: [],
			warnings: [],
		});
	});

	it("builds a limit sell at the exact limit price with the chosen tif", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			side: "sell",
			orderType: "limit",
			limitPriceInput: "105",
			tif: "Gtc",
		});
		expect(plan.orders).toEqual([{ a: 0, b: false, p: "105", s: "1.5", r: false, t: { limit: { tif: "Gtc" } } }]);
		expect(plan.grouping).toBe("na");
	});

	it("attaches a reduce-only tp trigger and switches grouping to normalTpsl", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, tpSlEnabled: true, canUseTpSl: true, tpPriceInput: "110" });
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "100.5", s: "1.5", r: false, t: { limit: { tif: "FrontendMarket" } } },
			{ a: 0, b: false, p: "110", s: "1.5", r: true, t: { trigger: { isMarket: true, triggerPx: "110", tpsl: "tp" } } },
		]);
		expect(plan.grouping).toBe("normalTpsl");
	});

	it("builds scale orders evenly spaced across the price range", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "scale",
			sizeValue: 3,
			scaleStartPriceInput: "100",
			scaleEndPriceInput: "110",
			scaleLevelsNum: 3,
		});
		expect(plan.orders.map((o) => o.p)).toEqual(["100", "105", "110"]);
		expect(plan.orders.every((o) => o.s === "1")).toBe(true);
		expect(plan.grouping).toBe("na");
	});

	it("builds a stop-market trigger with isMarket and sl tpsl", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "stopMarket",
			triggerPriceInput: "95",
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "95", s: "1.5", r: true, t: { trigger: { isMarket: true, triggerPx: "95", tpsl: "sl" } } },
		]);
	});

	it("builds a stop-limit trigger at the limit price (not market)", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "stopLimit",
			triggerPriceInput: "95",
			limitPriceInput: "96",
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "96", s: "1.5", r: true, t: { trigger: { isMarket: false, triggerPx: "95", tpsl: "sl" } } },
		]);
	});

	it("builds a take-profit-market trigger with tp tpsl", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, orderType: "takeProfitMarket", triggerPriceInput: "110" });
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "110", s: "1.5", r: true, t: { trigger: { isMarket: true, triggerPx: "110", tpsl: "tp" } } },
		]);
	});

	it("builds a take-profit-limit trigger at the limit price with tp tpsl", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "takeProfitLimit",
			triggerPriceInput: "110",
			limitPriceInput: "109",
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "109", s: "1.5", r: true, t: { trigger: { isMarket: false, triggerPx: "110", tpsl: "tp" } } },
		]);
	});

	it("attaches both tp and sl legs on the opposite side with normalTpsl grouping", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			tpSlEnabled: true,
			canUseTpSl: true,
			tpPriceInput: "110",
			slPriceInput: "90",
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "100.5", s: "1.5", r: false, t: { limit: { tif: "FrontendMarket" } } },
			{ a: 0, b: false, p: "110", s: "1.5", r: true, t: { trigger: { isMarket: true, triggerPx: "110", tpsl: "tp" } } },
			{ a: 0, b: false, p: "90", s: "1.5", r: true, t: { trigger: { isMarket: true, triggerPx: "90", tpsl: "sl" } } },
		]);
		expect(plan.grouping).toBe("normalTpsl");
	});

	it("propagates the chosen tif and reduceOnly to every scale level", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "scale",
			sizeValue: 3,
			scaleStartPriceInput: "100",
			scaleEndPriceInput: "110",
			scaleLevelsNum: 3,
			tif: "Alo",
			reduceOnly: true,
		});
		expect(plan.orders.every((o) => o.r === true)).toBe(true);
		expect(plan.orders.every((o) => JSON.stringify(o.t) === JSON.stringify({ limit: { tif: "Alo" } }))).toBe(true);
	});

	it("keeps a sub-1 price that already fits 5 significant figures and 6 - szDecimals decimals", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "limit",
			side: "sell",
			szDecimals: 0,
			sizeValue: 1000,
			limitPriceInput: "0.012345",
		});
		expect(plan.orders[0].p).toBe("0.012345");
	});
});

describe("buildOrderPlan swap (characterization — byte-exact spot swap math)", () => {
	const SWAP_BASE = {
		kind: "swap" as const,
		assetId: 0,
		isBuy: true,
		sizeValue: 1.5,
		szDecimals: 3,
		markPx: 100,
		slippageBps: 100,
	};

	it("prices a buy at markPx * (1 + bps/10000)", () => {
		const plan = buildOrderPlan(SWAP_BASE);
		expect(plan.orders).toEqual([
			{ a: 0, b: true, p: "101", s: "1.5", r: false, t: { limit: { tif: "FrontendMarket" } } },
		]);
		expect(plan.grouping).toBe("na");
	});

	it("prices a sell at markPx / (1 + bps/10000), rounded down to the spot tick", () => {
		const plan = buildOrderPlan({ ...SWAP_BASE, isBuy: false });
		expect(plan.orders[0]).toEqual({
			a: 0,
			b: false,
			p: "99.009",
			s: "1.5",
			r: false,
			t: { limit: { tif: "FrontendMarket" } },
		});
	});
});

describe("buildOrderPlan close/reverse/tpsl (characterization)", () => {
	it("market-closes a long as a reduce-only sell at slippage-adjusted price", () => {
		const plan = buildOrderPlan({
			kind: "marketClose",
			assetId: 0,
			size: 1.5,
			szDecimals: 3,
			isLong: true,
			markPx: 100,
			slippageBps: 50,
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: false, p: "99.5", s: "1.5", r: true, t: { limit: { tif: "FrontendMarket" } } },
		]);
		expect(plan.grouping).toBe("na");
	});

	it("reverses a long by doubling size with reduceOnly false", () => {
		const plan = buildOrderPlan({
			kind: "reverse",
			assetId: 0,
			size: 1.5,
			szDecimals: 3,
			isLong: true,
			markPx: 100,
			slippageBps: 50,
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: false, p: "99.5", s: "3", r: false, t: { limit: { tif: "FrontendMarket" } } },
		]);
	});

	it("limit-closes a short as a reduce-only buy at Gtc", () => {
		const plan = buildOrderPlan({
			kind: "limitClose",
			assetId: 0,
			size: 1.5,
			szDecimals: 3,
			isLong: false,
			price: 100,
		});
		expect(plan.orders).toEqual([{ a: 0, b: true, p: "100", s: "1.5", r: true, t: { limit: { tif: "Gtc" } } }]);
	});

	it("builds position tp+sl triggers with zero size and positionTpsl grouping", () => {
		const plan = buildOrderPlan({
			kind: "positionTpsl",
			assetId: 0,
			szDecimals: 3,
			isLong: true,
			tpPriceInput: "110",
			slPriceInput: "90",
		});
		expect(plan.orders).toEqual([
			{ a: 0, b: false, p: "110", s: "0", r: true, t: { trigger: { isMarket: true, triggerPx: "110", tpsl: "tp" } } },
			{ a: 0, b: false, p: "90", s: "0", r: true, t: { trigger: { isMarket: true, triggerPx: "90", tpsl: "sl" } } },
		]);
		expect(plan.grouping).toBe("positionTpsl");
	});

	it("reports an error when position tpsl has no prices", () => {
		const plan = buildOrderPlan({
			kind: "positionTpsl",
			assetId: 0,
			szDecimals: 3,
			isLong: true,
			tpPriceInput: null,
			slPriceInput: null,
		});
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.noTpSl]);
	});
});

describe("buildOrders grouping (characterization)", () => {
	it("returns na grouping for a plain market order", () => {
		const result = buildOrders({
			assetId: 0,
			side: "buy",
			orderType: "market",
			sizeValue: 1.5,
			szDecimals: 3,
			marketKind: "perp",
			markPx: 100,
			slippageBps: 50,
			reduceOnly: false,
			tif: "Gtc",
			limitPriceInput: "",
			triggerPriceInput: "",
			scaleStartPriceInput: "",
			scaleEndPriceInput: "",
			scaleLevelsNum: null,
			tpSlEnabled: false,
			canUseTpSl: false,
			tpPriceInput: "",
			slPriceInput: "",
		});
		expect(result.grouping).toBe("na");
		expect(result.orders).toHaveLength(1);
	});
});

describe("orders", () => {
	it("chooses smart leverage defaults", () => {
		expect(getDefaultLeverage(5)).toBe(5);
		expect(getDefaultLeverage(6)).toBe(3);
		expect(getDefaultLeverage(50)).toBe(25);
	});

	it("formats order prices to the tick in the requested direction", () => {
		const perp = { szDecimals: 0, kind: "perp" as const };
		expect(formatPriceForOrder(100, perp, "buy", "passive")).toBe("100");
		expect(formatPriceForOrder(1234.56, perp, "buy", "passive")).toBe("1234.5");
		expect(formatPriceForOrder(1234.56, perp, "buy", "aggressive")).toBe("1234.6");
		expect(formatPriceForOrder(1234.56, perp, "sell", "passive")).toBe("1234.6");
		expect(formatPriceForOrder(1234.56, perp, "sell", "aggressive")).toBe("1234.5");
		expect(formatPriceForOrder(123456.7, perp, "buy", "passive")).toBe("123450");
		expect(formatPriceForOrder(0.012345, perp, "sell", "passive")).toBe("0.012345");
	});

	it("formats order sizes using size decimals", () => {
		expect(formatSizeForOrder(1.234567, 3)).toBe("1.234");
		expect(formatSizeForOrder(1.2, 0)).toBe("1");
	});
});

function sumSizes(sizes: string[]): number {
	return sizes.reduce((total, size) => total + Number(size), 0);
}

const PERP_SZ0 = { szDecimals: 0, kind: "perp" } as const;

const SCALE_DIRECTIONS = [
	["buy", "10", "11"],
	["buy", "11", "10"],
	["sell", "10", "11"],
	["sell", "11", "10"],
	["buy", "11", "10.999999999999999999997"],
	["buy", "10.000000000000000000003", "11"],
	["sell", "10", "10.000000000000000000003"],
	["sell", "10.999999999999999999997", "10"],
] as const;

function scalePrices(side: "buy" | "sell", start: string, end: string, levels: number): string[] {
	const plan = buildOrderPlan({
		...ENTRY_BASE,
		side,
		orderType: "scale",
		szDecimals: 0,
		sizeValue: levels * 10,
		scaleStartPriceInput: start,
		scaleEndPriceInput: end,
		scaleLevelsNum: levels,
	});
	return plan.orders.map((order) => order.p);
}

describe("order wire format", () => {
	it.each([
		[10, "10"],
		[100, "100"],
		[250, "250"],
	])("closes a %d DOGE long at szDecimals 0 with the full size", (size, wireSize) => {
		const plan = buildOrderPlan({
			kind: "marketClose",
			assetId: 12,
			size,
			szDecimals: 0,
			isLong: true,
			markPx: 0.064543,
			slippageBps: 250,
		});
		expect(plan.orders).toEqual([
			{ a: 12, b: false, p: "0.062929", s: wireSize, r: true, t: { limit: { tif: "FrontendMarket" } } },
		]);
	});

	it("keeps integer sizes intact for entry and reverse at szDecimals 0", () => {
		const entry = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "limit",
			szDecimals: 0,
			sizeValue: 100,
			limitPriceInput: "0.15",
		});
		const reverse = buildOrderPlan({
			kind: "reverse",
			assetId: 173,
			size: 250,
			szDecimals: 0,
			isLong: false,
			markPx: 0.16,
			slippageBps: 250,
		});
		expect(entry.orders[0].s).toBe("100");
		expect(reverse.orders[0].s).toBe("500");
	});

	it("rounds a sub-dollar market price to 6 - szDecimals decimals, away from the book", () => {
		const dydx = {
			...ENTRY_BASE,
			assetId: 4,
			szDecimals: 1,
			sizeValue: 200,
			markPx: 0.09017,
			price: 0.09017,
			slippageBps: 250,
		};
		expect(buildOrderPlan(dydx).orders[0].p).toBe("0.09243");
		expect(buildOrderPlan({ ...dydx, side: "sell" }).orders[0].p).toBe("0.08791");
	});

	it("rounds limit prices toward the passive side", () => {
		const limit = { ...ENTRY_BASE, orderType: "limit" as const, szDecimals: 2, sizeValue: 10 };
		const buy = buildOrderPlan({ ...limit, side: "buy", limitPriceInput: "1.234567" });
		const sell = buildOrderPlan({ ...limit, side: "sell", limitPriceInput: "1.234541" });
		expect(buy.orders[0].p).toBe("1.2345");
		expect(sell.orders[0].p).toBe("1.2346");
	});

	it("uses the spot 8 - szDecimals decimal rule for spot markets", () => {
		const spot = { ...ENTRY_BASE, orderType: "limit" as const, marketKind: "spot" as const, assetId: 10107 };
		const sz2 = buildOrderPlan({
			...spot,
			szDecimals: 2,
			sizeValue: 1000,
			limitPriceInput: "0.0123456",
		});
		const sz0 = buildOrderPlan({
			...spot,
			szDecimals: 0,
			sizeValue: 1e7,
			limitPriceInput: "0.000012345678",
		});
		expect(sz2.orders[0].p).toBe("0.012345");
		expect(sz0.orders[0].p).toBe("0.00001234");
	});

	it("rounds a long's position TP trigger up, its SL trigger down, and both limit prices passively", () => {
		const plan = buildOrderPlan({
			kind: "positionTpsl",
			assetId: 5,
			szDecimals: 2,
			isLong: true,
			tpPriceInput: "120.123456",
			slPriceInput: "90.123456",
		});
		expect(plan.orders.map((order) => order.p)).toEqual(["120.13", "90.124"]);
		expect(plan.orders.map((order) => ("trigger" in order.t ? order.t.trigger.triggerPx : null))).toEqual([
			"120.13",
			"90.123",
		]);
		expect(plan.orders.map((order) => order.s)).toEqual(["0", "0"]);
	});

	it("allocates a scale remainder in whole lots so legs sum to the request", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "scale",
			szDecimals: 0,
			sizeValue: 18,
			scaleStartPriceInput: "100",
			scaleEndPriceInput: "104",
			scaleLevelsNum: 5,
		});
		const sizes = plan.orders.map((order) => order.s);
		expect(sumSizes(sizes)).toBe(18);
		expect(sizes).toEqual(["4", "4", "4", "3", "3"]);
		expect(plan.orders.map((order) => order.p)).toEqual(["100", "101", "102", "103", "104"]);
	});

	it("keeps the typed endpoints of a 4-leg scale on both sides", () => {
		expect(scalePrices("buy", "10", "11", 4)).toEqual(["10", "10.333", "10.666", "11"]);
		expect(scalePrices("sell", "11", "10", 4)).toEqual(["11", "10.667", "10.334", "10"]);
	});

	it("keeps scale legs passive when typed prices carry more decimals than a division keeps", () => {
		expect(scalePrices("sell", "10", "10.000000000000000000003", 4)).toEqual(["10", "10.001", "10.001", "10.001"]);
		expect(scalePrices("buy", "11", "10.999999999999999999997", 4)).toEqual(["11", "10.999", "10.999", "10.999"]);
	});

	it("keeps endpoints and on-tick interior legs exact for both sides in both directions", () => {
		expect(scalePrices("buy", "10", "11", 7)).toEqual(["10", "10.166", "10.333", "10.5", "10.666", "10.833", "11"]);
		expect(scalePrices("buy", "11", "10", 7)).toEqual(["11", "10.833", "10.666", "10.5", "10.333", "10.166", "10"]);
		expect(scalePrices("sell", "10", "11", 7)).toEqual(["10", "10.167", "10.334", "10.5", "10.667", "10.834", "11"]);
		expect(scalePrices("sell", "11", "10", 7)).toEqual(["11", "10.834", "10.667", "10.5", "10.334", "10.167", "10"]);
	});

	it("rounds every scale leg passively within one tick of the exact ladder at every level count", () => {
		const tick = Big("0.001");
		const misses: string[] = [];
		for (let levels = SCALE_LEVELS_MIN; levels <= SCALE_LEVELS_MAX; levels += 1) {
			const steps = levels - 1;
			for (const [side, start, end] of SCALE_DIRECTIONS) {
				const prices = scalePrices(side, start, end, levels);
				const typedEnds = [start, end].map((price) => formatPriceForOrder(price, PERP_SZ0, side, "passive"));
				if (prices[0] !== typedEnds[0] || prices.at(-1) !== typedEnds[1]) {
					misses.push(`${side} ${start}->${end} x${levels}: ${prices}`);
				}
				prices.forEach((price, i) => {
					const exactTimesSteps = Big(start).times(steps).plus(Big(end).minus(start).times(i));
					const low = Big(price)
						.minus(side === "buy" ? 0 : tick)
						.times(steps);
					const high = Big(price)
						.plus(side === "buy" ? tick : 0)
						.times(steps);
					const inRange =
						side === "buy"
							? low.lte(exactTimesSteps) && high.gt(exactTimesSteps)
							: low.lt(exactTimesSteps) && high.gte(exactTimesSteps);
					if (!inRange) misses.push(`${side} ${start}->${end} x${levels} leg ${i}: ${price}`);
				});
			}
		}
		expect(misses).toEqual([]);
	});

	it("blocks a scale order whose cheapest leg is under the minimum even when the average passes", () => {
		const plan = buildOrderPlan({
			...ENTRY_BASE,
			orderType: "scale",
			szDecimals: 2,
			sizeValue: 4,
			scaleStartPriceInput: "1",
			scaleEndPriceInput: "20",
			scaleLevelsNum: 2,
		});
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.belowMinNotional]);
	});

	it("blocks an opening order under the minimum notional on its wire price", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, szDecimals: 0, sizeValue: 1, markPx: 5, slippageBps: 250 });
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.belowMinNotional]);
	});

	it("lets a reduce-only close under the minimum notional through", () => {
		const plan = buildOrderPlan({
			kind: "marketClose",
			assetId: 7,
			size: 1,
			szDecimals: 0,
			isLong: true,
			markPx: 5,
			slippageBps: 250,
		});
		expect(plan.errors).toEqual([]);
		expect(plan.orders[0]).toMatchObject({ s: "1", r: true });
	});

	it("blocks a size that truncates to zero lots", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, szDecimals: 0, sizeValue: 0.4 });
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.invalidSize]);
	});

	it("blocks a price that is not a positive tick", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, orderType: "limit", limitPriceInput: "0" });
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.invalidPrice]);
	});

	it("rejects TWAP instead of building a limit order", () => {
		const plan = buildOrderPlan({ ...ENTRY_BASE, orderType: "twap", sizeValue: 3 });
		expect(plan.orders).toEqual([]);
		expect(plan.errors).toEqual([ORDER_PLAN_ERRORS.twapNotSupported]);
	});
});

describe("trigger prices fire no earlier than the typed level", () => {
	const BELOW_TICK_MID = "0.0645429";
	const ABOVE_TICK_MID = "0.0645431";
	const DOGE_ENTRY = {
		...ENTRY_BASE,
		assetId: 12,
		szDecimals: 0,
		sizeValue: 1000,
		orderType: "limit" as const,
		limitPriceInput: "0.0645",
	};
	const DOGE_POSITION = {
		kind: "positionTpsl" as const,
		assetId: 12,
		szDecimals: 0,
		tpPriceInput: null,
		slPriceInput: null,
	};
	const ATTACHED = { ...DOGE_ENTRY, tpSlEnabled: true, canUseTpSl: true };

	it.each([
		{
			label: "position long SL rounds down",
			intent: { ...DOGE_POSITION, isLong: true, slPriceInput: BELOW_TICK_MID },
			leg: 0,
			expected: { b: false, p: "0.064543", tpsl: "sl", triggerPx: "0.064542" },
		},
		{
			label: "position short SL rounds up",
			intent: { ...DOGE_POSITION, isLong: false, slPriceInput: ABOVE_TICK_MID },
			leg: 0,
			expected: { b: true, p: "0.064543", tpsl: "sl", triggerPx: "0.064544" },
		},
		{
			label: "position long TP rounds up",
			intent: { ...DOGE_POSITION, isLong: true, tpPriceInput: ABOVE_TICK_MID },
			leg: 0,
			expected: { b: false, p: "0.064544", tpsl: "tp", triggerPx: "0.064544" },
		},
		{
			label: "position short TP rounds down",
			intent: { ...DOGE_POSITION, isLong: false, tpPriceInput: BELOW_TICK_MID },
			leg: 0,
			expected: { b: true, p: "0.064542", tpsl: "tp", triggerPx: "0.064542" },
		},
		{
			label: "attached long SL rounds down",
			intent: { ...ATTACHED, side: "buy" as const, slPriceInput: BELOW_TICK_MID },
			leg: 1,
			expected: { b: false, p: "0.064543", tpsl: "sl", triggerPx: "0.064542" },
		},
		{
			label: "attached short SL rounds up",
			intent: { ...ATTACHED, side: "sell" as const, slPriceInput: ABOVE_TICK_MID },
			leg: 1,
			expected: { b: true, p: "0.064543", tpsl: "sl", triggerPx: "0.064544" },
		},
		{
			label: "attached long TP rounds up",
			intent: { ...ATTACHED, side: "buy" as const, tpPriceInput: ABOVE_TICK_MID },
			leg: 1,
			expected: { b: false, p: "0.064544", tpsl: "tp", triggerPx: "0.064544" },
		},
		{
			label: "attached short TP rounds down",
			intent: { ...ATTACHED, side: "sell" as const, tpPriceInput: BELOW_TICK_MID },
			leg: 1,
			expected: { b: true, p: "0.064542", tpsl: "tp", triggerPx: "0.064542" },
		},
		{
			label: "standalone buy stop rounds up",
			intent: {
				...DOGE_ENTRY,
				side: "buy" as const,
				orderType: "stopMarket" as const,
				triggerPriceInput: ABOVE_TICK_MID,
			},
			leg: 0,
			expected: { b: true, p: "0.064543", tpsl: "sl", triggerPx: "0.064544" },
		},
		{
			label: "standalone sell stop rounds down",
			intent: {
				...DOGE_ENTRY,
				side: "sell" as const,
				orderType: "stopMarket" as const,
				triggerPriceInput: BELOW_TICK_MID,
			},
			leg: 0,
			expected: { b: false, p: "0.064543", tpsl: "sl", triggerPx: "0.064542" },
		},
		{
			label: "standalone buy stop limit rounds up",
			intent: {
				...DOGE_ENTRY,
				side: "buy" as const,
				orderType: "stopLimit" as const,
				triggerPriceInput: ABOVE_TICK_MID,
				limitPriceInput: "0.0650001",
			},
			leg: 0,
			expected: { b: true, p: "0.065", tpsl: "sl", triggerPx: "0.064544" },
		},
		{
			label: "standalone sell stop limit rounds down",
			intent: {
				...DOGE_ENTRY,
				side: "sell" as const,
				orderType: "stopLimit" as const,
				triggerPriceInput: BELOW_TICK_MID,
				limitPriceInput: "0.0640001",
			},
			leg: 0,
			expected: { b: false, p: "0.064001", tpsl: "sl", triggerPx: "0.064542" },
		},
		{
			label: "standalone buy take profit rounds down",
			intent: {
				...DOGE_ENTRY,
				side: "buy" as const,
				orderType: "takeProfitMarket" as const,
				triggerPriceInput: BELOW_TICK_MID,
			},
			leg: 0,
			expected: { b: true, p: "0.064542", tpsl: "tp", triggerPx: "0.064542" },
		},
		{
			label: "standalone sell take profit rounds up",
			intent: {
				...DOGE_ENTRY,
				side: "sell" as const,
				orderType: "takeProfitMarket" as const,
				triggerPriceInput: ABOVE_TICK_MID,
			},
			leg: 0,
			expected: { b: false, p: "0.064544", tpsl: "tp", triggerPx: "0.064544" },
		},
	])("$label", ({ intent, leg, expected }) => {
		const plan = buildOrderPlan(intent);
		expect(plan.errors).toEqual([]);
		expect(plan.orders[leg]).toMatchObject({
			a: 12,
			b: expected.b,
			p: expected.p,
			r: true,
			t: { trigger: { triggerPx: expected.triggerPx, tpsl: expected.tpsl } },
		});
	});
});
