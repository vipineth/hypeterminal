import { CandleType } from "klinecharts";
import { CHART_FAVORITE_INTERVALS, CHART_SUPPORTED_RESOLUTIONS } from "@/config/constants";
import type { CandleInterval } from "./resolution";
import { RESOLUTIONS } from "./resolution";

export interface IntervalConfig {
	label: string;
	resolution: string;
	candleInterval: CandleInterval;
	barMs: number;
}

function buildIntervalConfig(resolution: string): IntervalConfig | null {
	const config = RESOLUTIONS[resolution];
	if (!config) return null;
	return { ...config, resolution };
}

export const FAVORITE_SET = new Set(CHART_FAVORITE_INTERVALS as unknown as string[]);

const ALL_INTERVALS = (CHART_SUPPORTED_RESOLUTIONS as unknown as string[])
	.map(buildIntervalConfig)
	.filter((c): c is IntervalConfig => c !== null);

export const STARRED_INTERVALS = ALL_INTERVALS.filter((i) => FAVORITE_SET.has(i.resolution));
export const MORE_INTERVALS = ALL_INTERVALS.filter((i) => !FAVORITE_SET.has(i.resolution));
export const DEFAULT_INTERVAL = STARRED_INTERVALS.find((i) => i.resolution === "60") ?? STARRED_INTERVALS[0];

export const CHART_TYPES = [
	{ label: "Candles", type: CandleType.CandleSolid },
	{ label: "Hollow", type: CandleType.CandleStroke },
	{ label: "OHLC", type: CandleType.Ohlc },
	{ label: "Area", type: CandleType.Area },
] as const;

export type ChartTypeConfig = (typeof CHART_TYPES)[number];

export const DEFAULT_CHART_TYPE = CHART_TYPES[0];
