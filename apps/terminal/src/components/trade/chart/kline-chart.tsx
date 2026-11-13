import type { Chart, KLineData } from "klinecharts";
import { dispose, init } from "klinecharts";
import { useEffect, useRef, useState } from "react";
import { type ChartTypeConfig, DEFAULT_CHART_TYPE, INITIAL_CANDLE_COUNT, VOLUME_INDICATOR_NAME } from "@/config/chart";
import { MS_PER_DAY, TAB_RESTORE_THRESHOLD_MS } from "@/config/time";
import { candleEventToKLineData, candleIntervalToPeriod, candlesToKLineData } from "@/lib/chart/candle";
import { formatShortDate, formatTime, formatTooltipDate } from "@/lib/chart/format";
import { DEFAULT_INTERVAL } from "@/lib/chart/kline-config";
import { buildKlineStyles } from "@/lib/chart/kline-styles";
import { registerLiquidationLineOverlay } from "@/lib/chart/liquidation-line-overlay";
import { registerOrderLineOverlay } from "@/lib/chart/order-line-overlay";
import { registerPositionLineOverlay } from "@/lib/chart/position-line-overlay";
import { getInfoClient, useSubscription } from "@/lib/hyperliquid";
import type { ChartSource, ChartSourceToggleIntentHandlers } from "./chart-source-toggle";
import { KlineToolbar } from "./kline-toolbar";
import { useKlineOrderOverlays } from "./use-kline-order-overlays";
import { useKlinePositionOverlays } from "./use-kline-position-overlays";

interface Props {
	symbol?: string;
	priceDecimals: number;
	positionDex?: string;
	theme?: "light" | "dark";
	yAxisInside?: boolean;
	onChartSourceChange?: (source: ChartSource) => void;
	tradingViewIntentHandlers?: ChartSourceToggleIntentHandlers;
}

const CANDLE_FETCH_RETRY_DELAYS_MS = [750, 2_000] as const;

type CandleSnapshotParams = Parameters<ReturnType<typeof getInfoClient>["candleSnapshot"]>[0];

function delay(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function logRecoverableCandleFetchFailure(label: string, err: unknown) {
	if (import.meta.env.DEV) {
		console.warn(`kline ${label} candle fetch failed`, err);
	}
}

async function fetchCandlesWithRetry(params: CandleSnapshotParams, shouldContinue: () => boolean) {
	let lastError: unknown;

	for (const retryDelayMs of [0, ...CANDLE_FETCH_RETRY_DELAYS_MS]) {
		if (!shouldContinue()) return [];
		// react-doctor-disable-next-line react-doctor/async-await-in-loop
		if (retryDelayMs > 0) await delay(retryDelayMs);
		if (!shouldContinue()) return [];

		try {
			return await getInfoClient().candleSnapshot(params);
		} catch (err) {
			lastError = err;
		}
	}

	throw lastError;
}

export function KlineChart({
	symbol = "",
	priceDecimals,
	positionDex,
	theme,
	yAxisInside = false,
	onChartSourceChange,
	tradingViewIntentHandlers,
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<Chart | null>(null);
	const [activeInterval, setActiveInterval] = useState(DEFAULT_INTERVAL);
	const [activeChartType, setActiveChartType] = useState<ChartTypeConfig>(DEFAULT_CHART_TYPE);
	const activeCandleType = activeChartType.type;
	const isHiddenRef = useRef(false);
	const hiddenAtRef = useRef<number | null>(null);
	const candleBufferRef = useRef<KLineData[]>([]);
	const pushCandleRef = useRef<((kline: KLineData) => void) | null>(null);
	const chartStyleRef = useRef({ candleType: activeCandleType, yAxisInside });
	chartStyleRef.current = { candleType: activeCandleType, yAxisInside };

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !symbol) return;
		let disposed = false;

		registerOrderLineOverlay();
		registerPositionLineOverlay();
		registerLiquidationLineOverlay();

		const chart = init(container, {
			layout: { yAxis: { inside: chartStyleRef.current.yAxisInside } },
			formatter: {
				formatDate: ({ timestamp, type }) => {
					const date = new Date(timestamp);
					if (type === "xAxis") {
						if (activeInterval.barMs >= MS_PER_DAY) return formatShortDate(date);
						if (date.getHours() === 0 && date.getMinutes() === 0) return formatShortDate(date);
						return formatTime(date);
					}
					return formatTooltipDate(date);
				},
			},
		});
		if (!chart) return;
		chartRef.current = chart;

		chart.setStyles(
			buildKlineStyles(chartStyleRef.current.candleType, {
				priceDecimals,
				yAxisInside: chartStyleRef.current.yAxisInside,
			}),
		);
		chart.createIndicator(VOLUME_INDICATOR_NAME);

		chart.setSymbol({ ticker: symbol, pricePrecision: priceDecimals });
		chart.setPeriod(candleIntervalToPeriod(activeInterval.candleInterval));
		chart.setDataLoader({
			getBars: ({ type, timestamp, callback }) => {
				const isForward = type === "forward" && timestamp != null;
				if (type !== "init" && !isForward) {
					callback([], false);
					return;
				}

				const endTime = isForward ? timestamp : Date.now();
				const startTime = endTime - INITIAL_CANDLE_COUNT * activeInterval.barMs;
				const isCurrent = () => !disposed && chartRef.current === chart;

				fetchCandlesWithRetry({ coin: symbol, interval: activeInterval.candleInterval, startTime, endTime }, isCurrent)
					.then((candles) => {
						if (!isCurrent()) return;
						const klines = candlesToKLineData(candles);
						const newKlines = isForward ? klines.filter((k) => k.timestamp < endTime) : klines;
						callback(newKlines, { forward: newKlines.length > 0 });
					})
					.catch((err) => {
						logRecoverableCandleFetchFailure(type, err);
						if (isCurrent()) callback([], false);
					});
			},
			subscribeBar: ({ callback }) => {
				pushCandleRef.current = callback;
			},
			unsubscribeBar: () => {
				pushCandleRef.current = null;
			},
		});

		const ro = new ResizeObserver(() => chart.resize());
		ro.observe(container);

		return () => {
			disposed = true;
			ro.disconnect();
			chartRef.current = null;
			pushCandleRef.current = null;
			candleBufferRef.current = [];
			dispose(container);
		};
	}, [symbol, priceDecimals, activeInterval]);

	useEffect(() => {
		const chart = chartRef.current;
		if (!chart) return;
		chart.setStyles(buildKlineStyles(activeCandleType, { priceDecimals, yAxisInside, theme }));
		chart.overrideYAxis({ inside: yAxisInside });
	}, [activeCandleType, priceDecimals, yAxisInside, theme]);

	useEffect(() => {
		isHiddenRef.current = document.visibilityState === "hidden";
		candleBufferRef.current = [];

		function handleVisibility() {
			if (document.visibilityState === "hidden") {
				isHiddenRef.current = true;
				hiddenAtRef.current = Date.now();
				return;
			}

			const gapMs = hiddenAtRef.current !== null ? Date.now() - hiddenAtRef.current : 0;
			isHiddenRef.current = false;
			hiddenAtRef.current = null;

			const chart = chartRef.current;
			if (!chart) return;

			for (const kline of candleBufferRef.current) {
				pushCandleRef.current?.(kline);
			}
			candleBufferRef.current = [];

			chart.resize();

			if (gapMs >= TAB_RESTORE_THRESHOLD_MS) chart.resetData();
		}

		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			candleBufferRef.current = [];
		};
	}, []);

	const candleData = useSubscription(
		"candle",
		{ coin: symbol, interval: activeInterval.candleInterval },
		{ enabled: !!symbol },
	);

	useEffect(() => {
		const pushCandle = pushCandleRef.current;
		const event = candleData.data;
		if (!pushCandle || !event) return;

		const klineData = candleEventToKLineData(event);
		if (!klineData) return;

		if (isHiddenRef.current) {
			candleBufferRef.current.push(klineData);
		} else {
			pushCandle(klineData);
		}
	}, [candleData.data]);

	useKlineOrderOverlays({ chartRef, symbol });
	useKlinePositionOverlays({ chartRef, symbol, dex: positionDex });

	return (
		<div className="flex flex-col h-full">
			<KlineToolbar
				activeInterval={activeInterval}
				onIntervalChange={setActiveInterval}
				activeChartType={activeChartType}
				onChartTypeChange={setActiveChartType}
				onChartSourceChange={onChartSourceChange}
				tradingViewIntentHandlers={tradingViewIntentHandlers}
			/>
			<div ref={containerRef} className="flex-1 min-h-0" />
		</div>
	);
}
