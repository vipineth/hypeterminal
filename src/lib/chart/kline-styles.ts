import type { DeepPartial, Styles } from "klinecharts";
import { type CandleType, LineType, TooltipShowRule, TooltipShowType, YAxisPosition } from "klinecharts";
import { colorToHex, colorToRgba, getChartColors } from "@/components/trade/chart/theme-colors";

export function buildKlineStyles(candleType: CandleType): DeepPartial<Styles> {
	const colors = getChartColors();

	const textSecondary = colorToHex(colors.textSecondary);
	const green = colorToHex(colors.green);
	const red = colorToHex(colors.red);
	const accent = colorToHex(colors.accent);
	const gridColor = colorToRgba(colors.border, 0.3);
	const scaleLineColor = colorToRgba(colors.border, 0.5);
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
		line: { show: true, style: LineType.Dashed, dashedValue: [4, 2], size: 1, color: accent },
		text: {
			show: true,
			color: overlayTextColor,
			size: 10,
			paddingLeft: 4,
			paddingRight: 4,
			paddingTop: 2,
			paddingBottom: 2,
			borderRadius: 2,
			backgroundColor: accent,
			borderSize: 0,
			borderColor: "transparent",
		},
	};

	const axisLine = { show: true, color: scaleLineColor, size: 1 };
	const tickLine = { show: true, color: scaleLineColor, size: 1, length: 3 };
	const tickText = { show: true, color: textSecondary, size: 10, marginStart: 4, marginEnd: 4 };

	return {
		grid: {
			horizontal: { show: true, color: gridColor, size: 1, style: LineType.Dashed },
			vertical: { show: true, color: gridColor, size: 1, style: LineType.Dashed },
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
				lineColor: accent,
				lineSize: 2,
				smooth: true,
				backgroundColor: [
					{ offset: 0, color: colorToRgba(colors.accent, 0.28) },
					{ offset: 1, color: colorToRgba(colors.accent, 0.02) },
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
						color: overlayTextColor,
					},
				},
			},
			tooltip: {
				showRule: TooltipShowRule.Always,
				showType: TooltipShowType.Standard,
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
		yAxis: { show: true, position: YAxisPosition.Right, axisLine, tickLine, tickText },
		separator: { color: colorToRgba(colors.border, 0.4), size: 1 },
		crosshair: {
			show: true,
			horizontal: crosshairAxis,
			vertical: crosshairAxis,
		},
	};
}
