/**
 * Utility to read CSS variables and build TradingView chart overrides
 * This ensures the chart colors stay in sync with the app theme
 */

type ChartColors = {
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	border: string;
	green: string;
	red: string;
	accent: string;
	surface: string;
};

/**
 * Reads a CSS variable value from the document
 */
function getCssVar(name: string): string {
	if (typeof window === "undefined") return "";
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Converts any CSS color (including oklch) to hex via canvas
 */
function colorToHex(cssColor: string): string {
	if (!cssColor || typeof document === "undefined") return "#000000";

	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "#000000";

	ctx.fillStyle = cssColor;
	ctx.fillRect(0, 0, 1, 1);

	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Converts CSS color to rgba string with specified alpha
 */
function colorToRgba(cssColor: string, alpha: number): string {
	if (!cssColor || typeof document === "undefined") return `rgba(0, 0, 0, ${alpha})`;

	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext("2d");
	if (!ctx) return `rgba(0, 0, 0, ${alpha})`;

	ctx.fillStyle = cssColor;
	ctx.fillRect(0, 0, 1, 1);

	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Reads current theme colors from CSS variables
 */
export function getChartColors(): ChartColors {
	return {
		background: getCssVar("--background"),
		foreground: getCssVar("--foreground"),
		muted: getCssVar("--muted"),
		mutedForeground: getCssVar("--muted-foreground"),
		border: getCssVar("--border"),
		green: getCssVar("--terminal-green"),
		red: getCssVar("--terminal-red"),
		accent: getCssVar("--terminal-cyan"),
		surface: getCssVar("--surface"),
	};
}

/**
 * Builds TradingView widget overrides from current CSS theme colors
 */
export function buildChartOverrides(): Record<string, string | number | boolean> {
	const colors = getChartColors();

	const bg = colorToHex(colors.background);
	const mutedFg = colorToHex(colors.mutedForeground);
	const green = colorToHex(colors.green);
	const red = colorToHex(colors.red);
	const accent = colorToHex(colors.accent);

	const gridColor = colorToRgba(colors.border, 0.3);
	const crosshairColor = accent;

	return {
		// Pane (chart area)
		"paneProperties.background": bg,
		"paneProperties.backgroundType": "solid",
		"paneProperties.vertGridProperties.color": gridColor,
		"paneProperties.horzGridProperties.color": gridColor,
		"paneProperties.crossHairProperties.color": crosshairColor,
		"paneProperties.crossHairProperties.style": 2,
		"paneProperties.crossHairProperties.width": 1,

		// Legend
		"paneProperties.legendProperties.showStudyArguments": true,
		"paneProperties.legendProperties.showStudyTitles": true,
		"paneProperties.legendProperties.showStudyValues": true,
		"paneProperties.legendProperties.showSeriesTitle": true,
		"paneProperties.legendProperties.showSeriesOHLC": true,
		"paneProperties.legendProperties.showLegend": true,
		"paneProperties.legendProperties.showBarChange": true,
		"paneProperties.legendProperties.showVolume": false,

		// Scales (price/time axis)
		"scalesProperties.backgroundColor": bg,
		"scalesProperties.lineColor": colorToRgba(colors.border, 0.5),
		"scalesProperties.textColor": mutedFg,
		"scalesProperties.fontSize": 10,
		"scalesProperties.scaleSeriesOnly": false,

		// Candles
		"mainSeriesProperties.candleStyle.upColor": green,
		"mainSeriesProperties.candleStyle.downColor": red,
		"mainSeriesProperties.candleStyle.borderUpColor": green,
		"mainSeriesProperties.candleStyle.borderDownColor": red,
		"mainSeriesProperties.candleStyle.wickUpColor": green,
		"mainSeriesProperties.candleStyle.wickDownColor": red,
		"mainSeriesProperties.candleStyle.drawBorder": true,
		"mainSeriesProperties.candleStyle.drawWick": true,

		// Hollow candles
		"mainSeriesProperties.hollowCandleStyle.upColor": green,
		"mainSeriesProperties.hollowCandleStyle.downColor": red,
		"mainSeriesProperties.hollowCandleStyle.borderUpColor": green,
		"mainSeriesProperties.hollowCandleStyle.borderDownColor": red,
		"mainSeriesProperties.hollowCandleStyle.wickUpColor": green,
		"mainSeriesProperties.hollowCandleStyle.wickDownColor": red,

		// Heikin Ashi
		"mainSeriesProperties.haStyle.upColor": green,
		"mainSeriesProperties.haStyle.downColor": red,
		"mainSeriesProperties.haStyle.borderUpColor": green,
		"mainSeriesProperties.haStyle.borderDownColor": red,
		"mainSeriesProperties.haStyle.wickUpColor": green,
		"mainSeriesProperties.haStyle.wickDownColor": red,

		// Bar style
		"mainSeriesProperties.barStyle.upColor": green,
		"mainSeriesProperties.barStyle.downColor": red,

		// Line style
		"mainSeriesProperties.lineStyle.color": accent,
		"mainSeriesProperties.lineStyle.linewidth": 2,

		// Area style
		"mainSeriesProperties.areaStyle.color1": colorToRgba(colors.accent, 0.28),
		"mainSeriesProperties.areaStyle.color2": colorToRgba(colors.accent, 0.02),
		"mainSeriesProperties.areaStyle.linecolor": accent,
		"mainSeriesProperties.areaStyle.linewidth": 2,

		// Baseline style
		"mainSeriesProperties.baselineStyle.topFillColor1": colorToRgba(colors.green, 0.28),
		"mainSeriesProperties.baselineStyle.topFillColor2": colorToRgba(colors.green, 0.02),
		"mainSeriesProperties.baselineStyle.bottomFillColor1": colorToRgba(colors.red, 0.02),
		"mainSeriesProperties.baselineStyle.bottomFillColor2": colorToRgba(colors.red, 0.28),
		"mainSeriesProperties.baselineStyle.topLineColor": green,
		"mainSeriesProperties.baselineStyle.bottomLineColor": red,

		// Price line
		"mainSeriesProperties.priceLineColor": accent,
		"mainSeriesProperties.priceLineWidth": 1,
		"mainSeriesProperties.showPriceLine": true,
		"mainSeriesProperties.showCountdown": true,

		// Status view
		"mainSeriesProperties.statusViewStyle.fontSize": 10,
		"mainSeriesProperties.statusViewStyle.showExchange": false,
		"mainSeriesProperties.statusViewStyle.showInterval": true,
		"mainSeriesProperties.statusViewStyle.symbolTextSource": "description",

		// Watermark
		"symbolWatermarkProperties.transparency": 96,
		"symbolWatermarkProperties.color": colorToRgba(colors.foreground, 0.03),

		// Volume
		volumePaneSize: "small",
	};
}

/**
 * Gets the loading screen colors for TradingView widget
 */
export function getLoadingScreenColors(): { backgroundColor: string; foregroundColor: string } {
	const colors = getChartColors();
	return {
		backgroundColor: colorToHex(colors.background),
		foregroundColor: colorToHex(colors.background), // Use same as bg to hide loading indicator
	};
}

/**
 * Gets the toolbar background color
 */
export function getToolbarBgColor(): string {
	const colors = getChartColors();
	return colorToHex(colors.background);
}

/**
 * Generates a gradient array of 19 shades from a base color
 * TradingView custom_themes requires 19 shades from lightest to darkest
 */
function generateColorGradient(baseHex: string): string[] {
	// Parse hex to RGB
	const r = Number.parseInt(baseHex.slice(1, 3), 16);
	const g = Number.parseInt(baseHex.slice(3, 5), 16);
	const b = Number.parseInt(baseHex.slice(5, 7), 16);

	const shades: string[] = [];

	// Generate 19 shades from light (index 0) to dark (index 18)
	// The base color is typically around index 9-10
	for (let i = 0; i < 19; i++) {
		// Lighter shades: blend towards white
		// Darker shades: blend towards black
		let newR: number;
		let newG: number;
		let newB: number;

		if (i < 9) {
			// Lighter: blend with white
			const lightFactor = 1 - i / 9;
			newR = Math.round(r + (255 - r) * lightFactor);
			newG = Math.round(g + (255 - g) * lightFactor);
			newB = Math.round(b + (255 - b) * lightFactor);
		} else if (i === 9) {
			// Base color
			newR = r;
			newG = g;
			newB = b;
		} else {
			// Darker: blend with black
			const darkFactor = 1 - (i - 9) / 9;
			newR = Math.round(r * darkFactor);
			newG = Math.round(g * darkFactor);
			newB = Math.round(b * darkFactor);
		}

		const hex = `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
		shades.push(hex);
	}

	return shades;
}

/**
 * Generates custom theme colors for TradingView widget
 * This provides a complete color palette that matches the app theme
 */
export function getCustomThemeColors(): {
	color1: string[];
	color2: string[];
	color3: string[];
	color4: string[];
	color5: string[];
	color6: string[];
	color7: string[];
	white: string;
	black: string;
} {
	const colors = getChartColors();

	const accent = colorToHex(colors.accent);
	const muted = colorToHex(colors.muted);
	const red = colorToHex(colors.red);
	const green = colorToHex(colors.green);
	const amber = colorToHex(getCssVar("--terminal-amber") || colors.accent);
	const purple = colorToHex(getCssVar("--terminal-purple") || colors.accent);
	const bg = colorToHex(colors.background);
	const fg = colorToHex(colors.foreground);

	return {
		color1: generateColorGradient(accent), // Blue replacement (accent)
		color2: generateColorGradient(muted), // Grey replacement
		color3: generateColorGradient(red), // Red
		color4: generateColorGradient(green), // Green
		color5: generateColorGradient(amber), // Orange replacement (amber)
		color6: generateColorGradient(purple), // Purple
		color7: generateColorGradient(accent), // Yellow replacement (use accent)
		white: bg,
		black: fg,
	};
}

/**
 * Generates a blob URL containing CSS variable overrides for colors
 * Imports static styles from /tradingview-theme.css
 */
export function generateChartCssUrl(): string {
	const colors = getChartColors();

	const bg = colorToHex(colors.background);
	const fg = colorToHex(colors.foreground);
	const mutedFg = colorToHex(colors.mutedForeground);
	const border = colorToHex(colors.border);
	const accent = colorToHex(colors.accent);
	const hoverBg = colorToRgba(colors.foreground, 0.06);

	// Import static styles and override CSS variables with current theme colors
	const css = `
@import url("/tradingview-theme.css");

:root {
	--tv-bg: ${bg};
	--tv-fg: ${fg};
	--tv-muted-fg: ${mutedFg};
	--tv-border: ${border};
	--tv-hover: ${hoverBg};
	--tv-accent: ${accent};
}
`;

	const blob = new Blob([css], { type: "text/css" });
	return URL.createObjectURL(blob);
}
