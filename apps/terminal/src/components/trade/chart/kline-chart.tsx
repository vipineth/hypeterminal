import { Dropdown } from "@hypeterminal/ui";
import type { Chart } from "klinecharts";
import { dispose, FormatDateType, init, LoadDataType } from "klinecharts";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
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
import { ORDER_LINE_NAME, registerOrderLineOverlay } from "@/lib/chart/order-line-overlay";
import { cn } from "@/lib/cn";
import { getInfoClient, useSubscription } from "@/lib/hyperliquid";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(date: Date): string {
	return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function formatTime(date: Date): string {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatTooltipDate(date: Date): string {
	const m = date.getMonth() + 1;
	const d = date.getDate();
	const y = String(date.getFullYear()).slice(2);
	return `${m}/${d}/${y} ${formatTime(date)}`;
}

interface Props {
	symbol?: string;
	theme?: "light" | "dark";
	yAxisInside?: boolean;
}

export function KlineChart({ symbol = "", yAxisInside = false }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<Chart | null>(null);
	const [activeInterval, setActiveInterval] = useState(DEFAULT_INTERVAL);
	const [activeChartType, setActiveChartType] = useState<ChartTypeConfig>(DEFAULT_CHART_TYPE);
	const intervalRef = useRef(activeInterval);
	intervalRef.current = activeInterval;
	const { address, isConnected } = useConnection();

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !symbol) return;

		registerOrderLineOverlay();

		const chart = init(container, {
			customApi: {
				formatDate: (_dateTimeFormat, timestamp, _format, type) => {
					const date = new Date(timestamp);
					if (type === FormatDateType.XAxis) {
						if (activeInterval.barMs >= 86_400_000) return formatShortDate(date);
						if (date.getHours() === 0 && date.getMinutes() === 0) return formatShortDate(date);
						return formatTime(date);
					}
					return formatTooltipDate(date);
				},
			},
		});
		if (!chart) return;
		chartRef.current = chart;

		chart.setStyles(buildKlineStyles(activeChartType.type, { yAxisInside }));
		chart.createIndicator("VOL");

		chart.setLoadDataCallback(({ type, data, callback }) => {
			const interval = intervalRef.current;

			if (type === LoadDataType.Forward && data) {
				const endTime = data.timestamp;
				const startTime = endTime - 500 * interval.barMs;

				getInfoClient()
					.candleSnapshot({
						coin: symbol,
						interval: interval.candleInterval,
						startTime,
						endTime,
					})
					.then((candles) => callback(candlesToKLineData(candles), candles.length > 0))
					.catch(() => callback([], false));
			}

			if (type === LoadDataType.Backward) {
				callback([], false);
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
	}, [symbol, activeInterval, activeChartType, yAxisInside]);

	const candleData = useSubscription(
		"candle",
		{ coin: symbol, interval: activeInterval.candleInterval },
		{ enabled: !!symbol },
	);

	useEffect(() => {
		const chart = chartRef.current;
		const event = candleData.data;
		if (!chart || !event) return;

		const klineData = candleEventToKLineData(event);
		if (!klineData) return;

		chart.updateData(klineData);
	}, [candleData.data]);

	const { data: openOrdersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);

	useEffect(() => {
		const chart = chartRef.current;
		if (!chart) return;

		chart.removeOverlay({ name: ORDER_LINE_NAME });

		const orders = openOrdersEvent?.orders;
		if (!orders) return;

		const symbolOrders = orders.filter((o) => o.coin === symbol);

		for (const order of symbolOrders) {
			const price = Number(order.limitPx);
			if (!Number.isFinite(price)) continue;

			const label = order.side === "B" ? "Limit Buy" : "Limit Sell";

			chart.createOverlay({
				name: ORDER_LINE_NAME,
				points: [{ value: price }],
				modeSensitivity: 0,
				styles: {
					rect: { color: "transparent", borderColor: "transparent", borderSize: 0 },
					polygon: { color: "transparent", borderColor: "transparent", borderSize: 0 },
				},
				extendData: {
					side: order.side,
					label,
				},
			});
		}
	}, [openOrdersEvent, symbol]);

	const isNonFavoriteActive = !FAVORITE_SET.has(activeInterval.resolution);

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-0.5 p-2 py-1.5 border-b border-stroke-weak/60 bg-bg-raised">
				{STARRED_INTERVALS.map((interval) => (
					<button
						key={interval.resolution}
						type="button"
						onClick={() => setActiveInterval(interval)}
						className={cn(
							"px-1.5 py-0.5 text-xs rounded-8 transition-colors",
							activeInterval.resolution === interval.resolution
								? "text-text-strong font-semibold"
								: "text-text-weak hover:text-text-strong",
						)}
					>
						{interval.label}
					</button>
				))}
				<Dropdown
					trigger={
						<span
							className={cn(
								"flex items-center gap-0.5 text-xs",
								isNonFavoriteActive ? "text-text-strong font-semibold" : "text-text-weak",
							)}
						>
							{isNonFavoriteActive && activeInterval.label}
						</span>
					}
					items={MORE_INTERVALS.map((interval) => ({
						label: interval.label,
						onSelect: () => setActiveInterval(interval),
					}))}
					align="start"
					size="sm"
					className="inline-flex"
				/>
				<div className="w-px h-3.5 bg-stroke-weak" />
				<Dropdown
					trigger={
						<span className="flex items-center gap-0.5 text-xs text-text-strong font-semibold">
							{activeChartType.label}
						</span>
					}
					items={CHART_TYPES.map((ct) => ({
						label: ct.label,
						onSelect: () => setActiveChartType(ct),
					}))}
					align="start"
					size="sm"
					className="inline-flex"
				/>
			</div>
			<div ref={containerRef} className="flex-1 min-h-0" />
		</div>
	);
}
