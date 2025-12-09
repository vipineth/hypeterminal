import { useEffect, useRef } from "react";
import type {
	ChartingLibraryFeatureset,
	ChartingLibraryWidgetConstructor,
	IBasicDataFeed,
	IChartingLibraryWidget,
	ResolutionString,
	TimeFrameItem,
} from "@/types/charting_library";
import { createDatafeed } from "./datafeed";

declare global {
	interface Window {
		TradingView: {
			widget: ChartingLibraryWidgetConstructor;
		};
	}
}

type TradingViewChartProps = {
	symbol?: string;
	interval?: string;
	theme?: "light" | "dark";
};

const LIBRARY_PATH = "https://cdn.asgard.finance/charting_library-28.3.0/";

const darkOverrides: Record<string, string | number | boolean> = {
	"paneProperties.background": "#0d0d0d",
	"paneProperties.backgroundType": "solid",
	"paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0.04)",
	"paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.04)",
	"paneProperties.crossHairProperties.color": "#5eead4",
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
	"scalesProperties.backgroundColor": "#0d0d0d",
	"scalesProperties.lineColor": "rgba(255, 255, 255, 0.08)",
	"scalesProperties.textColor": "rgba(255, 255, 255, 0.55)",
	"scalesProperties.fontSize": 10,
	"scalesProperties.scaleSeriesOnly": false,
	"mainSeriesProperties.candleStyle.upColor": "#22c55e",
	"mainSeriesProperties.candleStyle.downColor": "#ef4444",
	"mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
	"mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
	"mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
	"mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
	"mainSeriesProperties.candleStyle.drawBorder": true,
	"mainSeriesProperties.candleStyle.drawWick": true,
	"mainSeriesProperties.hollowCandleStyle.upColor": "#22c55e",
	"mainSeriesProperties.hollowCandleStyle.downColor": "#ef4444",
	"mainSeriesProperties.hollowCandleStyle.borderUpColor": "#22c55e",
	"mainSeriesProperties.hollowCandleStyle.borderDownColor": "#ef4444",
	"mainSeriesProperties.hollowCandleStyle.wickUpColor": "#22c55e",
	"mainSeriesProperties.hollowCandleStyle.wickDownColor": "#ef4444",
	"mainSeriesProperties.haStyle.upColor": "#22c55e",
	"mainSeriesProperties.haStyle.downColor": "#ef4444",
	"mainSeriesProperties.haStyle.borderUpColor": "#22c55e",
	"mainSeriesProperties.haStyle.borderDownColor": "#ef4444",
	"mainSeriesProperties.haStyle.wickUpColor": "#22c55e",
	"mainSeriesProperties.haStyle.wickDownColor": "#ef4444",
	"mainSeriesProperties.barStyle.upColor": "#22c55e",
	"mainSeriesProperties.barStyle.downColor": "#ef4444",
	"mainSeriesProperties.lineStyle.color": "#5eead4",
	"mainSeriesProperties.lineStyle.linewidth": 2,
	"mainSeriesProperties.areaStyle.color1": "rgba(94, 234, 212, 0.28)",
	"mainSeriesProperties.areaStyle.color2": "rgba(94, 234, 212, 0.02)",
	"mainSeriesProperties.areaStyle.linecolor": "#5eead4",
	"mainSeriesProperties.areaStyle.linewidth": 2,
	"mainSeriesProperties.baselineStyle.topFillColor1": "rgba(34, 197, 94, 0.28)",
	"mainSeriesProperties.baselineStyle.topFillColor2": "rgba(34, 197, 94, 0.02)",
	"mainSeriesProperties.baselineStyle.bottomFillColor1": "rgba(239, 68, 68, 0.02)",
	"mainSeriesProperties.baselineStyle.bottomFillColor2": "rgba(239, 68, 68, 0.28)",
	"mainSeriesProperties.baselineStyle.topLineColor": "#22c55e",
	"mainSeriesProperties.baselineStyle.bottomLineColor": "#ef4444",
	"mainSeriesProperties.priceLineColor": "#5eead4",
	"mainSeriesProperties.priceLineWidth": 1,
	"mainSeriesProperties.showPriceLine": true,
	"mainSeriesProperties.showCountdown": true,
	"mainSeriesProperties.statusViewStyle.fontSize": 10,
	"mainSeriesProperties.statusViewStyle.showExchange": false,
	"mainSeriesProperties.statusViewStyle.showInterval": true,
	"mainSeriesProperties.statusViewStyle.symbolTextSource": "description",
	"symbolWatermarkProperties.transparency": 96,
	"symbolWatermarkProperties.color": "rgba(255, 255, 255, 0.03)",
	volumePaneSize: "small",
};

const lightOverrides: Record<string, string | number | boolean> = {
	"paneProperties.background": "#f5f7f9",
	"paneProperties.backgroundType": "solid",
	"paneProperties.vertGridProperties.color": "rgba(0, 0, 50, 0.05)",
	"paneProperties.horzGridProperties.color": "rgba(0, 0, 50, 0.05)",
	"paneProperties.crossHairProperties.color": "#0ea5e9",
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
	"scalesProperties.backgroundColor": "#f5f7f9",
	"scalesProperties.lineColor": "rgba(0, 0, 50, 0.1)",
	"scalesProperties.textColor": "rgba(0, 0, 50, 0.6)",
	"scalesProperties.fontSize": 10,
	"scalesProperties.scaleSeriesOnly": false,
	"mainSeriesProperties.candleStyle.upColor": "#16a34a",
	"mainSeriesProperties.candleStyle.downColor": "#dc2626",
	"mainSeriesProperties.candleStyle.borderUpColor": "#16a34a",
	"mainSeriesProperties.candleStyle.borderDownColor": "#dc2626",
	"mainSeriesProperties.candleStyle.wickUpColor": "#16a34a",
	"mainSeriesProperties.candleStyle.wickDownColor": "#dc2626",
	"mainSeriesProperties.candleStyle.drawBorder": true,
	"mainSeriesProperties.candleStyle.drawWick": true,
	"mainSeriesProperties.hollowCandleStyle.upColor": "#16a34a",
	"mainSeriesProperties.hollowCandleStyle.downColor": "#dc2626",
	"mainSeriesProperties.hollowCandleStyle.borderUpColor": "#16a34a",
	"mainSeriesProperties.hollowCandleStyle.borderDownColor": "#dc2626",
	"mainSeriesProperties.hollowCandleStyle.wickUpColor": "#16a34a",
	"mainSeriesProperties.hollowCandleStyle.wickDownColor": "#dc2626",
	"mainSeriesProperties.haStyle.upColor": "#16a34a",
	"mainSeriesProperties.haStyle.downColor": "#dc2626",
	"mainSeriesProperties.haStyle.borderUpColor": "#16a34a",
	"mainSeriesProperties.haStyle.borderDownColor": "#dc2626",
	"mainSeriesProperties.haStyle.wickUpColor": "#16a34a",
	"mainSeriesProperties.haStyle.wickDownColor": "#dc2626",
	"mainSeriesProperties.barStyle.upColor": "#16a34a",
	"mainSeriesProperties.barStyle.downColor": "#dc2626",
	"mainSeriesProperties.lineStyle.color": "#0ea5e9",
	"mainSeriesProperties.lineStyle.linewidth": 2,
	"mainSeriesProperties.areaStyle.color1": "rgba(14, 165, 233, 0.28)",
	"mainSeriesProperties.areaStyle.color2": "rgba(14, 165, 233, 0.02)",
	"mainSeriesProperties.areaStyle.linecolor": "#0ea5e9",
	"mainSeriesProperties.areaStyle.linewidth": 2,
	"mainSeriesProperties.baselineStyle.topFillColor1": "rgba(22, 163, 74, 0.28)",
	"mainSeriesProperties.baselineStyle.topFillColor2": "rgba(22, 163, 74, 0.02)",
	"mainSeriesProperties.baselineStyle.bottomFillColor1": "rgba(220, 38, 38, 0.02)",
	"mainSeriesProperties.baselineStyle.bottomFillColor2": "rgba(220, 38, 38, 0.28)",
	"mainSeriesProperties.baselineStyle.topLineColor": "#16a34a",
	"mainSeriesProperties.baselineStyle.bottomLineColor": "#dc2626",
	"mainSeriesProperties.priceLineColor": "#0ea5e9",
	"mainSeriesProperties.priceLineWidth": 1,
	"mainSeriesProperties.showPriceLine": true,
	"mainSeriesProperties.showCountdown": true,
	"mainSeriesProperties.statusViewStyle.fontSize": 10,
	"mainSeriesProperties.statusViewStyle.showExchange": false,
	"mainSeriesProperties.statusViewStyle.showInterval": true,
	"mainSeriesProperties.statusViewStyle.symbolTextSource": "description",
	"symbolWatermarkProperties.transparency": 96,
	"symbolWatermarkProperties.color": "rgba(0, 0, 50, 0.03)",
	volumePaneSize: "small",
};

const timeFrames: TimeFrameItem[] = [
	{ text: "5y", resolution: "1W" as ResolutionString, description: "5 Years" },
	{ text: "1y", resolution: "1D" as ResolutionString, description: "1 Year" },
	{ text: "3m", resolution: "240" as ResolutionString, description: "3 Months" },
	{ text: "1m", resolution: "60" as ResolutionString, description: "1 Month" },
	{ text: "5d", resolution: "15" as ResolutionString, description: "5 Days" },
	{ text: "1d", resolution: "5" as ResolutionString, description: "1 Day" },
];

export function TradingViewChart({ symbol = "AAVE/USDC", interval = "60", theme = "dark" }: TradingViewChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<IChartingLibraryWidget | null>(null);
	const scriptLoadedRef = useRef(false);

	useEffect(() => {
		if (!containerRef.current) return;

		const loadScript = (): Promise<void> => {
			return new Promise((resolve, reject) => {
				if (window.TradingView) {
					resolve();
					return;
				}

				if (scriptLoadedRef.current) {
					const checkInterval = setInterval(() => {
						if (window.TradingView) {
							clearInterval(checkInterval);
							resolve();
						}
					}, 100);
					return;
				}

				scriptLoadedRef.current = true;
				const script = document.createElement("script");
				script.src = `${LIBRARY_PATH}charting_library.js`;
				script.async = true;
				script.onload = () => resolve();
				script.onerror = () => reject(new Error("Failed to load TradingView library"));
				document.head.appendChild(script);
			});
		};

		const initWidget = async () => {
			try {
				await loadScript();

				if (!containerRef.current || !window.TradingView) return;

				if (widgetRef.current) {
					widgetRef.current.remove();
				}

				const overrides = theme === "dark" ? darkOverrides : lightOverrides;
				const bgColor = theme === "dark" ? "#0d0d0d" : "#f5f7f9";
				const accentColor = theme === "dark" ? "#5eead4" : "#0ea5e9";

				widgetRef.current = new window.TradingView.widget({
					container: containerRef.current,
					library_path: LIBRARY_PATH,
					datafeed: createDatafeed() as unknown as IBasicDataFeed,
					symbol: symbol,
					interval: interval as ResolutionString,
					locale: "en",
					fullscreen: false,
					autosize: true,
					theme: theme,
					timezone: "Etc/UTC",
					debug: false,
					custom_font_family: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
					time_frames: timeFrames,
					enabled_features: [
						"side_toolbar_in_fullscreen_mode",
						"header_in_fullscreen_mode",
						"hide_last_na_study_output",
						"constraint_dialogs_to_chart",
						"dont_show_boolean_study_arguments",
						"hide_resolution_in_legend",
						"items_favoriting",
						"save_shortcut",
					] as ChartingLibraryFeatureset[],
					disabled_features: [
						"header_symbol_search",
						"header_compare",
						"display_market_status",
						"popup_hints",
						"header_saveload",
						"create_volume_indicator_by_default",
						"volume_force_overlay",
						"show_logo_on_all_charts",
						"caption_buttons_text_if_possible",
						"symbol_search_hot_key",
						"compare_symbol",
						"border_around_the_chart",
						"remove_library_container_border",
						"header_undo_redo",
						"go_to_date",
						"timezone_menu",
						"study_templates",
						"use_localstorage_for_settings",
						"save_chart_properties_to_local_storage",
						"countdown",
						"timeframes_toolbar",
						"main_series_scale_menu",
					] as ChartingLibraryFeatureset[],
					overrides: overrides,
					loading_screen: {
						backgroundColor: bgColor,
						foregroundColor: accentColor,
					},
					custom_css_url: "/tradingview-theme.css",
					toolbar_bg: bgColor,
					studies_overrides: {},
					favorites: {
						intervals: ["1", "5", "60", "240", "1D"] as ResolutionString[],
					},
				});

				widgetRef.current.onChartReady(() => {
					console.log("Chart is ready");
				});
			} catch (error) {
				console.error("Error initializing TradingView widget:", error);
			}
		};

		initWidget();

		return () => {
			if (widgetRef.current) {
				widgetRef.current.remove();
				widgetRef.current = null;
			}
		};
	}, [symbol, interval, theme]);

	return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "300px" }} />;
}
