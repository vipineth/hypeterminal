import { describe, expect, it } from "vitest";
import { slPriceValidator, type TpSlContext, tpPriceValidator } from "@/lib/errors/definitions/tpsl";
import { isTriggerUncrossed } from "@/lib/trade/tpsl";

describe("position TP/SL against mark", () => {
	const long = { side: "buy", szDecimals: 2 } as const;
	const short = { side: "sell", szDecimals: 2 } as const;

	it("lets a profitable long stop between entry 100 and mark 120", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "sl", triggerPx: "110", markPx: "120" })).toBe(true);
	});

	it("blocks a losing long stop at 90 that mark 80 has already crossed", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "sl", triggerPx: "90", markPx: "80" })).toBe(false);
	});

	it("lets a losing long stop below mark", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "sl", triggerPx: "70", markPx: "80" })).toBe(true);
	});

	it("blocks a long take profit above entry 100 but below mark 120", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "tp", triggerPx: "110", markPx: "120" })).toBe(false);
	});

	it("lets a losing long take profit between mark 80 and entry 100", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "tp", triggerPx: "90", markPx: "80" })).toBe(true);
	});

	it("lets a profitable short stop between mark 80 and entry 100", () => {
		expect(isTriggerUncrossed({ ...short, tpsl: "sl", triggerPx: "90", markPx: "80" })).toBe(true);
	});

	it("blocks a losing short stop at 110 that mark 120 has already crossed", () => {
		expect(isTriggerUncrossed({ ...short, tpsl: "sl", triggerPx: "110", markPx: "120" })).toBe(false);
	});

	it("blocks a short take profit below entry 100 but above mark 80", () => {
		expect(isTriggerUncrossed({ ...short, tpsl: "tp", triggerPx: "90", markPx: "80" })).toBe(false);
	});

	it("lets a losing short take profit between entry 100 and mark 120", () => {
		expect(isTriggerUncrossed({ ...short, tpsl: "tp", triggerPx: "110", markPx: "120" })).toBe(true);
	});

	it("blocks a trigger sitting exactly on mark", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "sl", triggerPx: "120", markPx: "120" })).toBe(false);
		expect(isTriggerUncrossed({ ...short, tpsl: "tp", triggerPx: "120", markPx: "120" })).toBe(false);
	});

	it("judges the rounded wire trigger, not the typed one", () => {
		const btc = { szDecimals: 5, markPx: "100000.5" };
		expect(isTriggerUncrossed({ ...btc, side: "buy", tpsl: "sl", triggerPx: "100000.7" })).toBe(true);
		expect(isTriggerUncrossed({ ...btc, side: "sell", tpsl: "sl", triggerPx: "100000.3" })).toBe(true);
		expect(isTriggerUncrossed({ ...btc, side: "buy", tpsl: "tp", triggerPx: "100000.3" })).toBe(true);
		expect(isTriggerUncrossed({ ...btc, side: "sell", tpsl: "tp", triggerPx: "100000.7" })).toBe(true);
	});

	it("blocks every trigger while mark is unknown", () => {
		expect(isTriggerUncrossed({ ...long, tpsl: "sl", triggerPx: "90", markPx: undefined })).toBe(false);
		expect(isTriggerUncrossed({ ...long, tpsl: "tp", triggerPx: "130", markPx: "0" })).toBe(false);
	});
});

function ticket(overrides: Partial<TpSlContext>): TpSlContext {
	return {
		tpSlEnabled: true,
		canUseTpSl: true,
		tpPriceNum: null,
		slPriceNum: null,
		price: 100,
		markPx: 100,
		side: "buy",
		szDecimals: 2,
		...overrides,
	};
}

describe("order ticket TP/SL against the price the position opens at", () => {
	it("blocks a stop above mark on a market buy", () => {
		const ctx = ticket({ price: 120, markPx: 120, slPriceNum: 125 });
		expect(slPriceValidator.validate(ctx)).toBe(false);
		expect(slPriceValidator.getMessage(ctx)).toBe("SL must be below mark");
	});

	it("blocks a stop between mark 100 and a marketable buy limit at 110", () => {
		const ctx = ticket({ price: 110, markPx: 100, slPriceNum: 105 });
		expect(slPriceValidator.validate(ctx)).toBe(false);
		expect(slPriceValidator.getMessage(ctx)).toBe("SL must be below mark");
	});

	it("lets a take profit between a resting buy limit at 90 and mark 100", () => {
		expect(tpPriceValidator.validate(ticket({ price: 90, markPx: 100, tpPriceNum: 95 }))).toBe(true);
	});

	it("blocks a stop above a resting buy limit at 90 even though it is below mark", () => {
		const ctx = ticket({ price: 90, markPx: 100, slPriceNum: 95 });
		expect(slPriceValidator.validate(ctx)).toBe(false);
		expect(slPriceValidator.getMessage(ctx)).toBe("SL must be below limit price");
	});

	it("blocks a stop between a marketable sell limit at 90 and mark 100", () => {
		const ctx = ticket({ side: "sell", price: 90, markPx: 100, slPriceNum: 95 });
		expect(slPriceValidator.validate(ctx)).toBe(false);
		expect(slPriceValidator.getMessage(ctx)).toBe("SL must be above mark");
	});

	it("lets a take profit between a marketable sell limit at 90 and mark 100", () => {
		expect(tpPriceValidator.validate(ticket({ side: "sell", price: 90, markPx: 100, tpPriceNum: 95 }))).toBe(true);
	});

	it("blocks a take profit above mark on a marketable sell limit", () => {
		const ctx = ticket({ side: "sell", price: 90, markPx: 100, tpPriceNum: 105 });
		expect(tpPriceValidator.validate(ctx)).toBe(false);
		expect(tpPriceValidator.getMessage(ctx)).toBe("TP must be below mark");
	});

	it("lets a take profit between mark 100 and a resting sell limit at 110", () => {
		expect(tpPriceValidator.validate(ticket({ side: "sell", price: 110, markPx: 100, tpPriceNum: 105 }))).toBe(true);
	});
});
