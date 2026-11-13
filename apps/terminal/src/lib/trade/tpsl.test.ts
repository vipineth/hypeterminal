import { describe, expect, it } from "vitest";
import {
	slPriceValidator,
	tpPriceValidator,
	type TpSlContext,
	tpSlLiveMarkValidator,
} from "@/lib/errors/definitions/tpsl";
import { checkTrigger } from "@/lib/trade/tpsl";

describe("position TP/SL against mark", () => {
	const long = { side: "buy", szDecimals: 2 } as const;
	const short = { side: "sell", szDecimals: 2 } as const;

	it("lets a profitable long stop between entry 100 and mark 120", () => {
		expect(checkTrigger({ ...long, tpsl: "sl", triggerPx: "110", referencePx: "120" })).toBe("uncrossed");
	});

	it("blocks a losing long stop at 90 that mark 80 has already crossed", () => {
		expect(checkTrigger({ ...long, tpsl: "sl", triggerPx: "90", referencePx: "80" })).toBe("crossed");
	});

	it("lets a losing long stop below mark", () => {
		expect(checkTrigger({ ...long, tpsl: "sl", triggerPx: "70", referencePx: "80" })).toBe("uncrossed");
	});

	it("blocks a long take profit above entry 100 but below mark 120", () => {
		expect(checkTrigger({ ...long, tpsl: "tp", triggerPx: "110", referencePx: "120" })).toBe("crossed");
	});

	it("lets a losing long take profit between mark 80 and entry 100", () => {
		expect(checkTrigger({ ...long, tpsl: "tp", triggerPx: "90", referencePx: "80" })).toBe("uncrossed");
	});

	it("lets a profitable short stop between mark 80 and entry 100", () => {
		expect(checkTrigger({ ...short, tpsl: "sl", triggerPx: "90", referencePx: "80" })).toBe("uncrossed");
	});

	it("blocks a losing short stop at 110 that mark 120 has already crossed", () => {
		expect(checkTrigger({ ...short, tpsl: "sl", triggerPx: "110", referencePx: "120" })).toBe("crossed");
	});

	it("blocks a short take profit below entry 100 but above mark 80", () => {
		expect(checkTrigger({ ...short, tpsl: "tp", triggerPx: "90", referencePx: "80" })).toBe("crossed");
	});

	it("lets a losing short take profit between entry 100 and mark 120", () => {
		expect(checkTrigger({ ...short, tpsl: "tp", triggerPx: "110", referencePx: "120" })).toBe("uncrossed");
	});

	it("blocks a trigger sitting exactly on mark for every side and kind", () => {
		expect(checkTrigger({ ...long, tpsl: "sl", triggerPx: "120", referencePx: "120" })).toBe("crossed");
		expect(checkTrigger({ ...long, tpsl: "tp", triggerPx: "120", referencePx: "120" })).toBe("crossed");
		expect(checkTrigger({ ...short, tpsl: "sl", triggerPx: "120", referencePx: "120" })).toBe("crossed");
		expect(checkTrigger({ ...short, tpsl: "tp", triggerPx: "120", referencePx: "120" })).toBe("crossed");
	});

	it("judges the rounded wire trigger, not the typed one", () => {
		const btc = { szDecimals: 5, referencePx: "100000.5" };
		expect(checkTrigger({ ...btc, side: "buy", tpsl: "sl", triggerPx: "100000.7" })).toBe("uncrossed");
		expect(checkTrigger({ ...btc, side: "sell", tpsl: "sl", triggerPx: "100000.3" })).toBe("uncrossed");
		expect(checkTrigger({ ...btc, side: "buy", tpsl: "tp", triggerPx: "100000.3" })).toBe("uncrossed");
		expect(checkTrigger({ ...btc, side: "sell", tpsl: "tp", triggerPx: "100000.7" })).toBe("uncrossed");
	});

	it("calls a trigger that rounds to zero invalid rather than crossed", () => {
		expect(checkTrigger({ ...long, tpsl: "sl", triggerPx: "0.00001", referencePx: "80" })).toBe("invalid");
		expect(checkTrigger({ ...short, tpsl: "tp", triggerPx: "0.00001", referencePx: "80" })).toBe("invalid");
	});
});

function ticket(overrides: Partial<TpSlContext>): TpSlContext {
	return {
		tpSlEnabled: true,
		canUseTpSl: true,
		tpPriceInput: "",
		slPriceInput: "",
		usesLimitPrice: false,
		limitPriceInput: "",
		liveMarkPx: "100",
		side: "buy",
		szDecimals: 2,
		...overrides,
	};
}

function buyLimit(limitPriceInput: string, overrides: Partial<TpSlContext>): TpSlContext {
	return ticket({ usesLimitPrice: true, limitPriceInput, ...overrides });
}

function sellLimit(limitPriceInput: string, overrides: Partial<TpSlContext>): TpSlContext {
	return ticket({ side: "sell", usesLimitPrice: true, limitPriceInput, ...overrides });
}

function tpError(ctx: TpSlContext): string | null {
	return tpPriceValidator.validate(ctx) ? null : tpPriceValidator.getMessage(ctx);
}

function slError(ctx: TpSlContext): string | null {
	return slPriceValidator.validate(ctx) ? null : slPriceValidator.getMessage(ctx);
}

describe("order ticket TP/SL against the price the position opens at", () => {
	it("blocks a stop above mark on a market buy", () => {
		expect(slError(ticket({ liveMarkPx: "120", slPriceInput: "125" }))).toBe("SL must be below mark");
	});

	it("blocks a take profit below mark on a market buy", () => {
		expect(tpError(ticket({ tpPriceInput: "95" }))).toBe("TP must be above mark");
	});

	it("blocks a stop below mark on a market sell", () => {
		expect(slError(ticket({ side: "sell", slPriceInput: "95" }))).toBe("SL must be above mark");
	});

	it("blocks a stop between mark 100 and a marketable buy limit at 110", () => {
		expect(slError(buyLimit("110", { slPriceInput: "105" }))).toBe("SL must be below mark");
	});

	it("lets a take profit between a resting buy limit at 90 and mark 100", () => {
		expect(tpError(buyLimit("90", { tpPriceInput: "95" }))).toBeNull();
	});

	it("blocks a stop above a resting buy limit at 90 even though it is below mark", () => {
		expect(slError(buyLimit("90", { slPriceInput: "95" }))).toBe("SL must be below limit price");
	});

	it("blocks a take profit below a resting buy limit at 90", () => {
		expect(tpError(buyLimit("90", { tpPriceInput: "85" }))).toBe("TP must be above limit price");
	});

	it("blocks a stop between a marketable sell limit at 90 and mark 100", () => {
		expect(slError(sellLimit("90", { slPriceInput: "95" }))).toBe("SL must be above mark");
	});

	it("lets a take profit between a marketable sell limit at 90 and mark 100", () => {
		expect(tpError(sellLimit("90", { tpPriceInput: "95" }))).toBeNull();
	});

	it("blocks a take profit above mark on a marketable sell limit", () => {
		expect(tpError(sellLimit("90", { tpPriceInput: "105" }))).toBe("TP must be below mark");
	});

	it("lets a take profit between mark 100 and a resting sell limit at 110", () => {
		expect(tpError(sellLimit("110", { tpPriceInput: "105" }))).toBeNull();
	});

	it("blocks a take profit above a resting sell limit at 110", () => {
		expect(tpError(sellLimit("110", { tpPriceInput: "115" }))).toBe("TP must be below limit price");
	});

	it("blocks a stop below a resting sell limit at 110", () => {
		expect(slError(sellLimit("110", { slPriceInput: "105" }))).toBe("SL must be above limit price");
	});

	it("judges a buy limit not typed yet against mark", () => {
		expect(slError(buyLimit("", { slPriceInput: "95" }))).toBeNull();
		expect(slError(buyLimit("0", { slPriceInput: "95" }))).toBeNull();
	});

	it("judges the limit price the order is sent at, not the one typed", () => {
		expect(slError(buyLimit("80.2769", { slPriceInput: "80.2765" }))).toBe("SL must be below limit price");
		expect(slError(sellLimit("100.001", { liveMarkPx: "90", slPriceInput: "100.002" }))).toBe(
			"SL must be above limit price",
		);
	});

	it("names a trigger that rounds to zero as invalid, not as crossed", () => {
		expect(slError(ticket({ slPriceInput: "0.00001" }))).toBe("Enter a valid SL price");
		expect(tpError(ticket({ side: "sell", tpPriceInput: "0.00001" }))).toBe("Enter a valid TP price");
	});

	it("waits for a live mark the same way on a buy limit and a sell limit", () => {
		const buy = buyLimit("90", { liveMarkPx: null, tpPriceInput: "120" });
		const sell = sellLimit("110", { liveMarkPx: null, tpPriceInput: "100" });
		for (const ctx of [buy, sell]) {
			expect(tpSlLiveMarkValidator.validate(ctx)).toBe(false);
			expect(tpSlLiveMarkValidator.getMessage(ctx)).toBe("Waiting for live mark price");
			expect(tpError(ctx)).toBeNull();
		}
	});
});
