/**
 * Utility to read CSS variables and build TradingView chart overrides
 * This ensures the chart colors stay in sync with the app theme
 */

import type { ColorGradient, CustomThemeColors } from "@/types/charting_library";

type ChartColors = {
	background: string;
	foreground: string;
	textSecondary: string;
	textTertiary: string;
	border: string;
	green: string;
	red: string;
	accent: string;
	surface: string;
};

function getCssVar(name: string): string {
	if (typeof window === "undefined") return "";
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

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

export function getChartColors(): ChartColors {
	return {
		background: getCssVar("--surface-analysis"),
		foreground: getCssVar("--text-950"),
		textSecondary: getCssVar("--text-600"),
		textTertiary: getCssVar("--text-500"),
		border: getCssVar("--border-200"),
		green: getCssVar("--market-up-600"),
		red: getCssVar("--market-down-600"),
		accent: getCssVar("--primary-default"),
		surface: getCssVar("--surface-execution"),
	};
}

export function buildChartOverrides(): Record<string, string | number | boolean> {
	const colors = getChartColors();

	const bg = colorToHex(colors.background);
	const textSecondary = colorToHex(colors.textSecondary);
	const green = colorToHex(colors.green);
	const red = colorToHex(colors.red);
	const accent = colorToHex(colors.accent);

	const gridColor = colorToRgba(colors.border, 0.3);
	const crosshairColor = accent;

	return {
		"paneProperties.background": bg,
		"paneProperties.backgroundType": "solid",
		"paneProperties.vertGridProperties.color": gridColor,
		"paneProperties.horzGridProperties.color": gridColor,
		"paneProperties.crossHairProperties.color": crosshairColor,
		"paneProperties.crossHairProperties.style": 2,
		"paneProperties.crossHairProperties.width": 1,

		"paneProperties.legendProperties.showStudyArguments": true,
		"paneProperties.legendProperties.showStudyTitles": true,
		"paneProperties.legendProperties.showStudyValues": true,
		"paneProperties.legendProperties.showSeriesTitle": true,
		"paneProperties.legendProperties.showSeriesOHLC": true,
		"paneProperties.legendProperties.showLegend": true,
		"paneProperties.legendProperties.showBarChange": true,
		"paneProperties.legendProperties.showVolume": false,

		"scalesProperties.backgroundColor": bg,
		"scalesProperties.lineColor": colorToRgba(colors.border, 0.5),
		"scalesProperties.textColor": textSecondary,
		"scalesProperties.fontSize": 10,
		"scalesProperties.scaleSeriesOnly": false,

		"mainSeriesProperties.candleStyle.upColor": green,
		"mainSeriesProperties.candleStyle.downColor": red,
		"mainSeriesProperties.candleStyle.borderUpColor": green,
		"mainSeriesProperties.candleStyle.borderDownColor": red,
		"mainSeriesProperties.candleStyle.wickUpColor": green,
		"mainSeriesProperties.candleStyle.wickDownColor": red,
		"mainSeriesProperties.candleStyle.drawBorder": true,
		"mainSeriesProperties.candleStyle.drawWick": true,

		"mainSeriesProperties.hollowCandleStyle.upColor": green,
		"mainSeriesProperties.hollowCandleStyle.downColor": red,
		"mainSeriesProperties.hollowCandleStyle.borderUpColor": green,
		"mainSeriesProperties.hollowCandleStyle.borderDownColor": red,
		"mainSeriesProperties.hollowCandleStyle.wickUpColor": green,
		"mainSeriesProperties.hollowCandleStyle.wickDownColor": red,

		"mainSeriesProperties.haStyle.upColor": green,
		"mainSeriesProperties.haStyle.downColor": red,
		"mainSeriesProperties.haStyle.borderUpColor": green,
		"mainSeriesProperties.haStyle.borderDownColor": red,
		"mainSeriesProperties.haStyle.wickUpColor": green,
		"mainSeriesProperties.haStyle.wickDownColor": red,

		"mainSeriesProperties.barStyle.upColor": green,
		"mainSeriesProperties.barStyle.downColor": red,

		"mainSeriesProperties.lineStyle.color": accent,
		"mainSeriesProperties.lineStyle.linewidth": 2,

		"mainSeriesProperties.areaStyle.color1": colorToRgba(colors.accent, 0.28),
		"mainSeriesProperties.areaStyle.color2": colorToRgba(colors.accent, 0.02),
		"mainSeriesProperties.areaStyle.linecolor": accent,
		"mainSeriesProperties.areaStyle.linewidth": 2,

		"mainSeriesProperties.baselineStyle.topFillColor1": colorToRgba(colors.green, 0.28),
		"mainSeriesProperties.baselineStyle.topFillColor2": colorToRgba(colors.green, 0.02),
		"mainSeriesProperties.baselineStyle.bottomFillColor1": colorToRgba(colors.red, 0.02),
		"mainSeriesProperties.baselineStyle.bottomFillColor2": colorToRgba(colors.red, 0.28),
		"mainSeriesProperties.baselineStyle.topLineColor": green,
		"mainSeriesProperties.baselineStyle.bottomLineColor": red,

		"mainSeriesProperties.priceLineColor": accent,
		"mainSeriesProperties.priceLineWidth": 1,
		"mainSeriesProperties.showPriceLine": true,
		"mainSeriesProperties.showCountdown": true,

		"mainSeriesProperties.statusViewStyle.fontSize": 10,
		"mainSeriesProperties.statusViewStyle.showExchange": false,
		"mainSeriesProperties.statusViewStyle.showInterval": true,
		"mainSeriesProperties.statusViewStyle.symbolTextSource": "description",

		"symbolWatermarkProperties.transparency": 96,
		"symbolWatermarkProperties.color": colorToRgba(colors.foreground, 0.03),

		volumePaneSize: "small",
	};
}

export function getLoadingScreenColors(): { backgroundColor: string; foregroundColor: string } {
	const colors = getChartColors();
	return {
		backgroundColor: colorToHex(colors.background),
		foregroundColor: colorToHex(colors.background),
	};
}

export function getToolbarBgColor(): string {
	const colors = getChartColors();
	return colorToHex(colors.background);
}

function generateColorGradient(baseHex: string): ColorGradient {
	const r = Number.parseInt(baseHex.slice(1, 3), 16);
	const g = Number.parseInt(baseHex.slice(3, 5), 16);
	const b = Number.parseInt(baseHex.slice(5, 7), 16);

	const shades = new Array<string>(19);

	for (let i = 0; i < 19; i++) {
		let newR: number;
		let newG: number;
		let newB: number;

		if (i < 9) {
			const lightFactor = 1 - i / 9;
			newR = Math.round(r + (255 - r) * lightFactor);
			newG = Math.round(g + (255 - g) * lightFactor);
			newB = Math.round(b + (255 - b) * lightFactor);
		} else if (i === 9) {
			newR = r;
			newG = g;
			newB = b;
		} else {
			const darkFactor = 1 - (i - 9) / 9;
			newR = Math.round(r * darkFactor);
			newG = Math.round(g * darkFactor);
			newB = Math.round(b * darkFactor);
		}

		const hex = `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
		shades[i] = hex;
	}

	return shades as ColorGradient;
}

export function getCustomThemeColors(): CustomThemeColors {
	const colors = getChartColors();

	const accent = colorToHex(colors.accent);
	const textTertiary = colorToHex(colors.textTertiary);
	const red = colorToHex(colors.red);
	const green = colorToHex(colors.green);
	const amber = colorToHex(getCssVar("--warning-700") || colors.accent);
	const purple = colorToHex(getCssVar("--primary-default") || colors.accent);
	const bg = colorToHex(colors.background);
	const fg = colorToHex(colors.foreground);

	return {
		color1: generateColorGradient(accent),
		color2: generateColorGradient(textTertiary),
		color3: generateColorGradient(red),
		color4: generateColorGradient(green),
		color5: generateColorGradient(amber),
		color6: generateColorGradient(purple),
		color7: generateColorGradient(accent),
		white: bg,
		black: fg,
	};
}

let staticCssCache: string | null = null;

async function fetchStaticCss(): Promise<string> {
	if (staticCssCache) return staticCssCache;

	try {
		const response = await fetch("/tradingview-theme.css");
		if (!response.ok) throw new Error("Failed to fetch CSS");
		staticCssCache = await response.text();
		return staticCssCache;
	} catch (error) {
		console.error("Failed to load tradingview-theme.css:", error);
		return "";
	}
}

export async function generateChartCssUrl(): Promise<string> {
	const colors = getChartColors();

	const bg = colorToHex(colors.background);
	const fg = colorToHex(colors.foreground);
	const surface = colorToHex(colors.surface);
	const textSecondary = colorToHex(colors.textSecondary);
	const border = colorToRgba(colors.border, 0.4);
	const accent = colorToHex(colors.accent);

	const hoverBg = colorToRgba(colors.foreground, 0.06);
	const activeBg = colorToRgba(colors.foreground, 0.1);
	const accentSoft = colorToRgba(colors.accent, 0.15);

	const staticCss = await fetchStaticCss();

	const css = `
${staticCss}

:root {
	--tv-bg: ${bg};
	--tv-fg: ${fg};
	--tv-muted-fg: ${textSecondary};
	--tv-border: ${border};
	--tv-accent: ${accent};

	--tv-color-platform-background: ${bg};
	--tv-color-pane-background: ${bg};

	--tv-color-toolbar-button-background-hover: ${hoverBg};
	--tv-color-toolbar-button-background-expanded: ${colorToRgba(colors.foreground, 0.08)};
	--tv-color-toolbar-button-background-active: ${activeBg};
	--tv-color-toolbar-button-background-active-hover: ${colorToRgba(colors.foreground, 0.12)};
	--tv-color-toolbar-button-background-clicked: ${activeBg};
	--tv-color-toolbar-button-text: ${textSecondary};
	--tv-color-toolbar-button-text-hover: ${fg};
	--tv-color-toolbar-button-text-active: ${fg};
	--tv-color-toolbar-button-text-active-hover: ${fg};
	--tv-color-toolbar-button-text-clicked: ${fg};

	--tv-color-item-active-text: ${accent};
	--tv-color-toolbar-toggle-button-background-active: ${accentSoft};
	--tv-color-toolbar-toggle-button-background-active-hover: ${colorToRgba(colors.accent, 0.2)};

	--tv-color-toolbar-divider-background: ${colorToRgba(colors.border, 0.6)};
	--tv-color-toolbar-save-layout-loader: ${accent};
	--tv-color-bar-mark-background-color: ${surface};

	--tv-color-popup-background: ${surface};
	--tv-color-popup-element-text: ${fg};
	--tv-color-popup-element-text-hover: ${fg};
	--tv-color-popup-element-background-hover: ${hoverBg};
	--tv-color-popup-element-divider-background: ${border};
	--tv-color-popup-element-secondary-text: ${textSecondary};
	--tv-color-popup-element-hint-text: ${colorToRgba(colors.textSecondary, 0.7)};
	--tv-color-popup-element-text-active: ${accent};
	--tv-color-popup-element-background-active: ${accentSoft};
	--tv-color-popup-element-toolbox-text: ${textSecondary};
	--tv-color-popup-element-toolbox-text-hover: ${fg};
	--tv-color-popup-element-toolbox-text-active-hover: ${accent};
	--tv-color-popup-element-toolbox-background-hover: ${hoverBg};
	--tv-color-popup-element-toolbox-background-active-hover: ${accentSoft};

	--tv-color-dialog-header-text: ${fg};
	--tv-color-dialog-header-separator: ${border};
	--tv-color-scrollbar-thumb-background: ${border};

	--themed-color-bg: ${bg};
	--themed-color-body-bg: ${bg};
	--themed-color-main-background: ${bg};
	--themed-color-chart-page-bg: ${bg};
	--themed-color-pane-bg: ${bg};
	--themed-color-dialog-background: ${surface};
	--themed-color-popup-background: ${surface};
	--themed-color-primary-popup: ${surface};
	--themed-color-tree-bg: ${surface};
	--themed-color-content-item-bg: ${surface};
	--themed-color-properties-dialog-tab-bg: ${surface};
	--themed-color-rename-input-background: ${surface};
	--themed-color-indicators-hint-background: ${surface};

	--themed-color-text: ${fg};
	--themed-color-text-primary: ${fg};
	--themed-color-text-regular: ${fg};
	--themed-color-primary-text: ${fg};
	--themed-color-title: ${fg};
	--themed-color-indicators-text: ${fg};
	--themed-color-item-text: ${fg};
	--themed-color-item-row-text: ${fg};
	--themed-color-add-dialog-text: ${fg};
	--themed-color-load-chart-dialog-text: ${fg};
	--themed-color-button-text: ${fg};
	--themed-color-button-text-color: ${fg};
	--themed-color-arrow-text: ${fg};

	--themed-color-text-secondary: ${textSecondary};
	--themed-color-default-gray: ${textSecondary};
	--themed-color-gray: ${textSecondary};
	--themed-color-grayed-text: ${textSecondary};
	--themed-color-placeholder: ${textSecondary};
	--themed-color-icon: ${textSecondary};
	--themed-color-icons: ${textSecondary};
	--themed-color-primary-icon: ${textSecondary};
	--themed-color-sort-button: ${textSecondary};
	--themed-color-drag-icon: ${textSecondary};
	--themed-color-disabled-title: ${colorToRgba(colors.textSecondary, 0.5)};

	--themed-color-border: ${border};
	--themed-color-separator: ${border};
	--themed-color-divider: ${border};
	--themed-color-search-border: ${border};
	--themed-color-header-border: ${border};
	--themed-color-header-separator-border: ${border};
	--themed-color-section-separator-border: ${border};
	--themed-color-container-border: ${border};
	--themed-color-properties-dialog-borders: ${border};
	--themed-color-tab-switcher-border: ${border};
	--themed-color-templates-dialog-body-border: ${border};
	--themed-color-popup-menu-separator: ${border};
	--themed-color-item-row-border: ${border};
	--themed-color-white-border: ${border};

	--themed-color-input-bg: ${surface};
	--themed-color-input-border: ${border};
	--themed-color-input-text: ${fg};
	--themed-color-input-placeholder-text: ${textSecondary};
	--themed-color-input-border-hover: ${textSecondary};
	--themed-color-input-disabled-bg: ${bg};
	--themed-color-input-disabled-border: ${colorToRgba(colors.border, 0.5)};
	--themed-color-input-disabled-text: ${textSecondary};

	--themed-color-hovered-background: ${hoverBg};
	--themed-color-background-hover: ${hoverBg};
	--themed-color-hovered-button-background: ${hoverBg};
	--themed-color-item-row-bg-hover: ${hoverBg};
	--themed-color-container-hover-bg: ${hoverBg};
	--themed-color-button-bg: ${surface};
	--themed-color-button-bg-hover: ${hoverBg};
	--themed-color-button-hover-bg: ${hoverBg};
	--themed-color-button-hover: ${hoverBg};
	--themed-color-button-bg-selected: ${activeBg};
	--themed-color-edit-button-background-hover: ${hoverBg};

	--themed-color-item-active-text: ${accent};
	--themed-color-item-active-bg: ${accentSoft};
	--themed-color-item-selected: ${accentSoft};
	--themed-color-item-selected-blue: ${accentSoft};
	--themed-color-item-bg-selected: ${accentSoft};
	--themed-color-list-item-bg-selected: ${accentSoft};
	--themed-color-selection-bg: ${accentSoft};
	--themed-color-selected-border: ${accent};
	--themed-color-background-selected: ${accentSoft};
	--themed-color-active-tab-text-color: ${fg};

	--themed-color-brand: ${accent};
	--themed-color-brand-hover: ${accent};
	--themed-color-brand-active: ${accent};
	--themed-color-favorite-checked: ${accent};

	--themed-color-scrollbar-default: ${border};
	--themed-color-scrollbar-hover: ${textSecondary};
	--themed-color-scrollbar-active: ${textSecondary};
	--themed-color-scroll-bg: ${bg};
	--themed-color-overlay-scroll-bar: ${border};

	--themed-color-common-tooltip-bg: ${surface};
	--themed-color-common-tooltip-text: ${fg};
	--themed-color-tooltip-background: ${surface};
	--themed-color-tooltip-text: ${fg};

	--themed-color-checkbox: ${border};
	--themed-color-checkbox-hover: ${textSecondary};
	--themed-color-checkbox-checked: ${accent};
	--themed-color-checkbox-checked-hover: ${accent};
	--themed-color-checkbox-icon: ${fg};
	--themed-color-radio: ${border};
	--themed-color-radio-hover: ${textSecondary};
	--themed-color-radio-checked: ${accent};
	--themed-color-radio-checked-hover: ${accent};

	--themed-color-switch-bg: ${border};
	--themed-color-switch-border: ${border};
	--themed-color-active-switch-bg: ${accent};

	--themed-color-link: ${accent};
	--themed-color-link-primary-default: ${accent};
	--themed-color-link-primary-hover: ${accent};
	--themed-color-link-primary-active: ${accent};
	--themed-color-highlight-search: ${colorToRgba(colors.accent, 0.3)};

	--themed-color-icon-hover: ${fg};
	--themed-color-icon-hover-color: ${fg};
	--themed-color-icon-selected: ${accent};
	--themed-color-icon-selected-hover: ${accent};
	--themed-color-arrow-text-hover: ${fg};
	--themed-color-arrow-stroke: ${textSecondary};
	--themed-color-caret-hover: ${fg};
	--themed-color-close-button-hover-bg: ${hoverBg};
	--themed-color-close-button-hover-text: ${fg};
	--themed-color-close-button-active-bg: ${activeBg};
	--themed-color-close-button-active-text: ${fg};

	--themed-color-modal-backdrop: rgba(0, 0, 0, 0.5);
	--themed-color-drawer-backdrop: rgba(0, 0, 0, 0.5);
	--themed-color-floating-toolbar-shadow: rgba(0, 0, 0, 0.2);

	--themed-color-content-primary-neutral: ${fg};
	--themed-color-content-primary-neutral-bold: ${fg};
	--themed-color-content-primary-neutral-semi-bold: ${fg};
	--themed-color-content-primary-neutral-normal: ${fg};
	--themed-color-content-primary-neutral-light: ${textSecondary};
	--themed-color-content-primary-neutral-extra-light: ${colorToRgba(colors.textSecondary, 0.6)};
	--themed-color-content-secondary-neutral: ${textSecondary};
	--themed-color-content-secondary-neutral-medium: ${textSecondary};
	--themed-color-content-secondary-neutral-semi-bold: ${textSecondary};
	--themed-color-content-disabled: ${colorToRgba(colors.textSecondary, 0.5)};

	--themed-color-container-fill-primary-neutral: ${bg};
	--themed-color-container-fill-primary-neutral-light: ${surface};
	--themed-color-container-fill-primary-neutral-extra-light: ${surface};
	--themed-color-container-fill-secondary-neutral: ${surface};
	--themed-color-container-fill-secondary-neutral-normal: ${surface};
	--themed-color-container-fill-secondary-neutral-semi-bold: ${border};
	--themed-color-container-fill-primary-accent: ${accentSoft};
	--themed-color-container-fill-primary-accent-bold: ${accent};
	--themed-color-container-fill-primary-accent-semi-bold: ${colorToRgba(colors.accent, 0.3)};
}
`;

	const blob = new Blob([css], { type: "text/css" });
	return URL.createObjectURL(blob);
}
