import type { CandleStyle, KLineData } from "klinecharts";
import { describe, expect, it } from "vitest";
import { buildKlineStyles } from "@/lib/chart/kline-styles";

function legendValues(priceDecimals: number, candle: KLineData): string[] {
	const template = buildKlineStyles("candle_solid", { priceDecimals }).candle?.tooltip?.legend?.template;
	if (typeof template !== "function") throw new Error("candle legend has no template");
	const legends = template({ prev: null, current: candle, next: null }, {} as CandleStyle);
	return legends.map((legend) => (typeof legend.value === "string" ? legend.value : legend.value.text));
}

describe("kline candle legend", () => {
	it("shows a spot candle below a millionth at its full price", () => {
		const bid = { timestamp: 0, open: 0.00000032, high: 0.00000033, low: 0.00000031, close: 0.00000032, volume: 1 };

		expect(legendValues(8, bid).slice(1, 5)).toEqual(["0.00000032", "0.00000033", "0.00000031", "0.00000032"]);
	});
});
