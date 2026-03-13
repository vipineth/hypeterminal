import type { CandleTooltipCustomCallbackData, DeepPartial, Styles } from "klinecharts";
import { type CandleType, LineType, TooltipShowRule, TooltipShowType, YAxisPosition } from "klinecharts";
import { colorToHex, colorToRgba, getChartChromeColors, getChartColors } from "@/components/trade/chart/theme-colors";

function formatTooltipTs(ts: number): string {
	const d = new Date(ts);
	return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatPrice(n: number): string {
	if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const s = n.toString();
	const dot = s.indexOf(".");
	if (dot === -1) return n.toLocaleString("en-US", { minimumFractionDigits: 2 });
	let zeros = 0;
	for (let i = dot + 1; i < s.length; i++) {
		if (s[i] === "0") zeros++;
		else break;
	}
	const decimals = Math.max(2, zeros + 4);
	return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatVolume(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface KlineStyleOptions {
	yAxisInside?: boolean;
}

export function buildKlineStyles(candleType: CandleType, options?: KlineStyleOptions): DeepPartial<Styles> {
	const colors = getChartColors();

	const textSecondary = colorToHex(colors.textSecondary);
	const textTertiary = colorToHex(colors.textTertiary);
	const green = colorToHex(colors.green);
	const red = colorToHex(colors.red);
	const chrome = getChartChromeColors(colors);
	const scaleLineColor = chrome.scaleLine;
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
		line: { show: true, style: LineType.Dashed, dashedValue: [4, 2], size: 1, color: textSecondary },
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
			horizontal: { show: false },
			vertical: { show: false },
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
					upColor: green,
					downColor: red,
					noChangeColor: textSecondary,
					line: { show: true, style: LineType.Dashed, size: 1, dashedValue: [4, 4] },
					text: {
						show: true,
						size: 10,
						paddingLeft: 4,
						paddingRight: 4,
						paddingTop: 2,
						paddingBottom: 2,
						borderRadius: 2,
						color: "#ffffff",
					},
				},
			},
			tooltip: {
				showRule: TooltipShowRule.Always,
				showType: TooltipShowType.Standard,
				custom: (data: CandleTooltipCustomCallbackData) => {
					const { current } = data;
					const isUp = current.close >= current.open;
					const candleColor = isUp ? green : red;
					return [
						{
							title: { text: "", color: "transparent" },
							value: { text: formatTooltipTs(current.timestamp), color: textTertiary },
						},
						{
							title: { text: "O ", color: textTertiary },
							value: { text: formatPrice(current.open), color: candleColor },
						},
						{
							title: { text: "H ", color: textTertiary },
							value: { text: formatPrice(current.high), color: candleColor },
						},
						{
							title: { text: "L ", color: textTertiary },
							value: { text: formatPrice(current.low), color: candleColor },
						},
						{
							title: { text: "C ", color: textTertiary },
							value: { text: formatPrice(current.close), color: candleColor },
						},
						{
							title: { text: "Vol ", color: textTertiary },
							value: { text: formatVolume(current.volume ?? 0), color: textSecondary },
						},
					];
				},
				text: tooltipText,
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
				showRule: TooltipShowRule.Always,
				showType: TooltipShowType.Standard,
				text: tooltipText,
			},
		},
		xAxis: { show: true, axisLine, tickLine, tickText },
		yAxis: {
			show: true,
			position: YAxisPosition.Right,
			inside: options?.yAxisInside ?? false,
			axisLine: options?.yAxisInside ? { show: false } : axisLine,
			tickLine: options?.yAxisInside ? { show: false } : tickLine,
			tickText: options?.yAxisInside ? { ...tickText, marginStart: 2, marginEnd: 2 } : tickText,
		},
		separator: { color: chrome.separator, size: 1 },
		crosshair: {
			show: true,
			horizontal: crosshairAxis,
			vertical: crosshairAxis,
		},
		overlay: {
			rect: { color: "transparent", borderColor: "transparent", borderSize: 0 },
			polygon: { color: "transparent", borderColor: "transparent", borderSize: 0 },
		},
	};
}
