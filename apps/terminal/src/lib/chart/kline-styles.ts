import type { CandleType, DeepPartial, Styles, TooltipLegend } from "klinecharts";
import {
	chartCrosshairAlpha,
	chartGridAlpha,
	chartPaneSeparatorAlpha,
	chartScaleLineAlpha,
	colorToHex,
	colorToRgba,
	getChartColors,
	strokeWeakLayerRgba,
} from "./theme-colors";

function formatTooltipTs(ts: number): string {
	const d = new Date(ts);
	return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatPrice(n: number, priceDecimals: number): string {
	return n.toLocaleString("en-US", {
		minimumFractionDigits: Math.min(2, priceDecimals),
		maximumFractionDigits: priceDecimals,
	});
}

function formatVolume(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface KlineStyleOptions {
	priceDecimals: number;
	yAxisInside?: boolean;
	// Theme is read implicitly via CSS custom properties on `document.documentElement`,
	// so this argument has no effect on the returned styles. It exists so callers can
	// thread `theme` as a real dependency instead of suppressing it via `void theme`.
	theme?: "light" | "dark";
}

export const TRANSPARENT_OVERLAY_STYLES = {
	rect: { color: "transparent", borderColor: "transparent", borderSize: 0 },
	polygon: { color: "transparent", borderColor: "transparent", borderSize: 0 },
};

export function buildKlineStyles(candleType: CandleType, options: KlineStyleOptions): DeepPartial<Styles> {
	const colors = getChartColors();

	const textSecondary = colorToHex(colors.textSecondary);
	const textTertiary = colorToHex(colors.textTertiary);
	const green = colorToHex(colors.green);
	const red = colorToHex(colors.red);
	const gridColor = strokeWeakLayerRgba(colors.border, chartGridAlpha);
	const scaleLineColor = strokeWeakLayerRgba(colors.border, chartScaleLineAlpha);
	const overlayTextColor = colorToHex(colors.foreground);

	const tooltipText = {
		size: 10,
		color: textSecondary,
		marginLeft: 8,
		marginTop: 4,
		marginRight: 8,
		marginBottom: 0,
	};

	const crosshairAxis = {
		show: true,
		line: {
			show: true,
			style: "dashed" as const,
			dashedValue: [4, 2],
			size: 1,
			color: strokeWeakLayerRgba(colors.border, chartCrosshairAlpha),
		},
		text: {
			show: true,
			color: colorToHex(colors.background),
			size: 10,
			paddingLeft: 4,
			paddingRight: 4,
			paddingTop: 2,
			paddingBottom: 2,
			borderRadius: 2,
			backgroundColor: overlayTextColor,
			borderSize: 0,
			borderColor: "transparent",
		},
	};

	const axisLine = { show: true, color: scaleLineColor, size: 1 };
	const tickLine = { show: true, color: scaleLineColor, size: 1, length: 3 };
	const tickText = { show: true, color: textSecondary, size: 10, marginStart: 4, marginEnd: 4 };

	return {
		grid: {
			horizontal: { show: true, color: gridColor, size: 1, style: "dashed" },
			vertical: { show: true, color: gridColor, size: 1, style: "dashed" },
		},
		candle: {
			type: candleType,
			bar: {
				upColor: green,
				downColor: red,
				upBorderColor: green,
				downBorderColor: red,
				upWickColor: green,
				downWickColor: red,
			},
			area: {
				lineColor: textSecondary,
				lineSize: 2,
				smooth: true,
				backgroundColor: [
					{ offset: 0, color: colorToRgba(colors.textSecondary, 0.18) },
					{ offset: 1, color: colorToRgba(colors.textSecondary, 0.02) },
				],
			},
			priceMark: {
				show: true,
				high: { show: true, color: textSecondary, textSize: 10 },
				low: { show: true, color: textSecondary, textSize: 10 },
				last: {
					show: true,
					upColor: overlayTextColor,
					downColor: overlayTextColor,
					noChangeColor: overlayTextColor,
					line: { show: true, style: "dashed", size: 1, dashedValue: [4, 4] },
					text: {
						show: true,
						size: 10,
						paddingLeft: 4,
						paddingRight: 4,
						paddingTop: 2,
						paddingBottom: 2,
						borderRadius: 2,
						color: colorToHex(colors.background),
					},
				},
			},
			tooltip: {
				showRule: "always",
				showType: "standard",
				title: { show: false },
				legend: {
					...tooltipText,
					template: ({ current }): TooltipLegend[] => {
						if (!current) return [];
						const isUp = current.close >= current.open;
						const candleColor = isUp ? green : red;
						return [
							{
								title: { text: "", color: "transparent" },
								value: { text: formatTooltipTs(current.timestamp), color: textTertiary },
							},
							{
								title: { text: "O ", color: textTertiary },
								value: { text: formatPrice(current.open, options.priceDecimals), color: candleColor },
							},
							{
								title: { text: "H ", color: textTertiary },
								value: { text: formatPrice(current.high, options.priceDecimals), color: candleColor },
							},
							{
								title: { text: "L ", color: textTertiary },
								value: { text: formatPrice(current.low, options.priceDecimals), color: candleColor },
							},
							{
								title: { text: "C ", color: textTertiary },
								value: { text: formatPrice(current.close, options.priceDecimals), color: candleColor },
							},
							{
								title: { text: "Vol ", color: textTertiary },
								value: { text: formatVolume(current.volume ?? 0), color: textSecondary },
							},
						];
					},
				},
			},
		},
		indicator: {
			ohlc: { upColor: green, downColor: red, noChangeColor: textSecondary },
			bars: [
				{
					upColor: colorToRgba(colors.green, 0.5),
					downColor: colorToRgba(colors.red, 0.5),
					noChangeColor: textSecondary,
				},
			],
			tooltip: {
				showRule: "always",
				showType: "standard",
				title: tooltipText,
				legend: tooltipText,
			},
		},
		xAxis: { show: true, axisLine, tickLine, tickText },
		yAxis: {
			show: true,
			axisLine: options.yAxisInside ? { show: false } : axisLine,
			tickLine: options.yAxisInside ? { show: false } : tickLine,
			tickText: options.yAxisInside ? { ...tickText, marginStart: 2, marginEnd: 2 } : tickText,
		},
		separator: { color: strokeWeakLayerRgba(colors.border, chartPaneSeparatorAlpha), size: 1 },
		crosshair: {
			show: true,
			horizontal: crosshairAxis,
			vertical: crosshairAxis,
		},
		overlay: {
			rect: { color: "transparent", borderColor: "transparent", borderSize: 0 },
			polygon: { color: "transparent", borderColor: "transparent", borderSize: 0 },
			text: { backgroundColor: "transparent", borderSize: 0, borderColor: "transparent" },
		},
	};
}
