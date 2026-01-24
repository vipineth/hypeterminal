import type { CandleSnapshotResponse, CandleWsEvent } from "@nktkas/hyperliquid";
import { toFiniteNumber } from "@/lib/trade/numbers";
import type { Bar } from "@/types/charting_library";

const CHART_NAME_SEPARATOR = "::";

function parseDecimal(value: unknown): number {
	const parsed = toFiniteNumber(value);
	return parsed ?? Number.NaN;
}

export function candleSnapshotToBar(candle: CandleSnapshotResponse[number]): Bar | null {
	const open = parseDecimal(candle.o);
	const high = parseDecimal(candle.h);
	const low = parseDecimal(candle.l);
	const close = parseDecimal(candle.c);
	const volume = parseDecimal(candle.v);

	if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
		return null;
	}

	return {
		time: candle.t,
		open,
		high,
		low,
		close,
		volume: Number.isFinite(volume) ? volume : undefined,
	};
}

export function candleEventToBar(event: CandleWsEvent): Bar | null {
	const open = parseDecimal(event.o);
	const high = parseDecimal(event.h);
	const low = parseDecimal(event.l);
	const close = parseDecimal(event.c);
	const volume = parseDecimal(event.v);

	if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
		return null;
	}

	return {
		time: event.t,
		open,
		high,
		low,
		close,
		volume: Number.isFinite(volume) ? volume : undefined,
	};
}

export function filterAndSortBars(bars: (Bar | null)[], fromMs: number, toMs: number): Bar[] {
	return bars
		.filter((bar): bar is Bar => bar !== null && bar.time >= fromMs && bar.time < toMs)
		.sort((a, b) => a.time - b.time);
}

export function createChartName(displayName: string, symbol: string): string {
	return `${displayName}${CHART_NAME_SEPARATOR}${symbol}`;
}

export function parseChartName(chartName: string): { displayName: string; symbol: string } {
	const [displayName, symbol] = chartName.split(CHART_NAME_SEPARATOR);
	return { displayName: displayName ?? chartName, symbol: symbol ?? chartName };
}
