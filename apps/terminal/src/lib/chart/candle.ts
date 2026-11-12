import type { CandleSnapshotResponse, CandleWsEvent } from "@nktkas/hyperliquid";
import type { KLineData, Period, PeriodType } from "klinecharts";
import { toNumber } from "@/lib/trade/numbers";
import type { Bar } from "@/types/charting_library";
import type { CandleInterval } from "./resolution";

interface RawCandle {
	t: number;
	o: string;
	h: string;
	l: string;
	c: string;
	v: string;
}

function rawCandleToBar(candle: RawCandle): Bar | null {
	const open = toNumber(candle.o);
	const high = toNumber(candle.h);
	const low = toNumber(candle.l);
	const close = toNumber(candle.c);
	const volume = toNumber(candle.v);

	if (open == null || high == null || low == null || close == null) return null;

	return {
		time: candle.t,
		open,
		high,
		low,
		close,
		volume: volume ?? undefined,
	};
}

function barToKLineData(bar: Bar): KLineData {
	return {
		timestamp: bar.time,
		open: bar.open,
		high: bar.high,
		low: bar.low,
		close: bar.close,
		volume: bar.volume ?? 0,
	};
}

export function candleSnapshotToBar(candle: CandleSnapshotResponse[number]): Bar | null {
	return rawCandleToBar(candle);
}

export function candleEventToBar(event: CandleWsEvent): Bar | null {
	return rawCandleToBar(event);
}

export function filterAndSortBars(bars: (Bar | null)[], fromMs: number, toMs: number): Bar[] {
	return bars
		.filter((bar): bar is Bar => bar !== null && bar.time >= fromMs && bar.time < toMs)
		.sort((a, b) => a.time - b.time);
}

export function candlesToKLineData(candles: CandleSnapshotResponse): KLineData[] {
	const result: KLineData[] = [];
	for (const c of candles) {
		const bar = candleSnapshotToBar(c);
		if (!bar) continue;
		result.push(barToKLineData(bar));
	}
	return result.sort((a, b) => a.timestamp - b.timestamp);
}

export function candleEventToKLineData(event: CandleWsEvent): KLineData | null {
	const bar = candleEventToBar(event);
	if (!bar) return null;
	return barToKLineData(bar);
}

const PERIOD_TYPES: Record<string, PeriodType> = { m: "minute", h: "hour", d: "day", w: "week", M: "month" };

export function candleIntervalToPeriod(interval: CandleInterval): Period {
	const span = Number.parseInt(interval, 10);
	return { span, type: PERIOD_TYPES[interval.slice(String(span).length)] };
}
