import { CaretDownIcon } from "@phosphor-icons/react";
import type { Chart } from "klinecharts";
import { dispose, init, LoadDataType } from "klinecharts";
import { useEffect, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { candleEventToKLineData, candlesToKLineData } from "@/lib/chart/candle";
import {
	CHART_TYPES,
	type ChartTypeConfig,
	DEFAULT_CHART_TYPE,
	DEFAULT_INTERVAL,
	FAVORITE_SET,
	MORE_INTERVALS,
	STARRED_INTERVALS,
} from "@/lib/chart/kline-config";
import { buildKlineStyles } from "@/lib/chart/kline-styles";
import { cn } from "@/lib/cn";
import { getInfoClient } from "@/lib/hyperliquid/clients";
import { useSubCandle } from "@/lib/hyperliquid/hooks/subscription/useSubCandle";

interface Props {
	symbol?: string;
	theme?: "light" | "dark";
}

export function KlineChart({ symbol = "", theme = "dark" }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<Chart | null>(null);
	const [activeInterval, setActiveInterval] = useState(DEFAULT_INTERVAL);
	const [activeChartType, setActiveChartType] = useState<ChartTypeConfig>(DEFAULT_CHART_TYPE);
	const intervalRef = useRef(activeInterval);
	intervalRef.current = activeInterval;

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !symbol) return;

		const chart = init(container);
		if (!chart) return;
		chartRef.current = chart;

		chart.setStyles(buildKlineStyles(activeChartType.type));
		chart.createIndicator("VOL");

		chart.setLoadDataCallback(({ type, data, callback }) => {
			const interval = intervalRef.current;

			if (type === LoadDataType.Init || type === LoadDataType.Backward) {
				const endTime = type === LoadDataType.Backward && data ? data.timestamp : Date.now();
				const startTime = endTime - 500 * interval.barMs;

				getInfoClient()
					.candleSnapshot({
						coin: symbol,
						interval: interval.candleInterval,
						startTime,
						endTime,
					})
					.then((candles) => callback(candlesToKLineData(candles), true))
					.catch(() => callback([], false));
			}
		});

		const endTime = Date.now();
		const startTime = endTime - 500 * activeInterval.barMs;

		getInfoClient()
			.candleSnapshot({
				coin: symbol,
				interval: activeInterval.candleInterval,
				startTime,
				endTime,
			})
			.then((candles) => {
				if (chartRef.current === chart) {
					chart.applyNewData(candlesToKLineData(candles), true);
				}
			})
			.catch(() => {});

		const ro = new ResizeObserver(() => chart.resize());
		ro.observe(container);

		return () => {
			ro.disconnect();
			chartRef.current = null;
			dispose(container);
		};
	}, [symbol, theme, activeInterval, activeChartType]);

	const candleData = useSubCandle({ coin: symbol, interval: activeInterval.candleInterval }, { enabled: !!symbol });

	useEffect(() => {
		const chart = chartRef.current;
		const event = candleData.data;
		if (!chart || !event) return;

		const klineData = candleEventToKLineData(event);
		if (!klineData) return;

		chart.updateData(klineData);
	}, [candleData.data]);

	const isNonFavoriteActive = !FAVORITE_SET.has(activeInterval.resolution);

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-0.5 p-2 py-1.5 border-b border-border-200/85 bg-surface-analysis">
				{STARRED_INTERVALS.map((interval) => (
					<button
						key={interval.resolution}
						type="button"
						onClick={() => setActiveInterval(interval)}
						className={cn(
							"px-1.5 py-0.5 text-3xs rounded-xs transition-colors",
							activeInterval.resolution === interval.resolution
								? "text-text-950 font-semibold"
								: "text-text-500 hover:text-text-950",
						)}
					>
						{interval.label}
					</button>
				))}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className={cn(
								"flex items-center gap-0.5 px-1.5 py-0.5 text-3xs rounded-xs transition-colors",
								isNonFavoriteActive ? "text-text-950 font-semibold" : "text-text-500 hover:text-text-950",
							)}
						>
							{isNonFavoriteActive && activeInterval.label}
							<CaretDownIcon className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-20">
						{MORE_INTERVALS.map((interval) => (
							<DropdownMenuItem
								key={interval.resolution}
								selected={activeInterval.resolution === interval.resolution}
								onSelect={() => setActiveInterval(interval)}
							>
								{interval.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				<div className="w-px h-3.5 bg-border-200" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-0.5 px-1.5 py-0.5 text-3xs text-text-950 font-semibold rounded-xs hover:bg-surface-execution/50 transition-colors"
						>
							{activeChartType.label}
							<CaretDownIcon className="size-2.5 text-text-500" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-24">
						{CHART_TYPES.map((ct) => (
							<DropdownMenuItem
								key={ct.label}
								selected={activeChartType.label === ct.label}
								onSelect={() => setActiveChartType(ct)}
							>
								{ct.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div ref={containerRef} className="flex-1 min-h-0" />
		</div>
	);
}
