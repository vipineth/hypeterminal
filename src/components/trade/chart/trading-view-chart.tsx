import { useEffect, useRef } from "react";
import type {
	ChartingLibraryFeatureset,
	ChartingLibraryWidgetConstructor,
	IBasicDataFeed,
	IChartingLibraryWidget,
	ResolutionString,
} from "@/types/charting_library";
import { createDatafeed } from "./datafeed";
import {
	CHART_LIBRARY_PATH,
	CHART_TIME_FRAMES,
	DEFAULT_CHART_INTERVAL,
	DEFAULT_CHART_SYMBOL,
	DEFAULT_CHART_THEME,
	TIMEZONE,
} from "./constants";
import {
	buildChartOverrides,
	generateChartCssUrl,
	getCustomThemeColors,
	getLoadingScreenColors,
	getToolbarBgColor,
} from "./theme-colors";

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

export function TradingViewChart({
	symbol = DEFAULT_CHART_SYMBOL,
	interval = DEFAULT_CHART_INTERVAL,
	theme = DEFAULT_CHART_THEME,
}: TradingViewChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<IChartingLibraryWidget | null>(null);
	const scriptLoadedRef = useRef(false);
	const cssUrlRef = useRef<string | null>(null);

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
				script.src = `${CHART_LIBRARY_PATH}charting_library.js`;
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

				// Clean up previous CSS blob URL
				if (cssUrlRef.current) {
					URL.revokeObjectURL(cssUrlRef.current);
				}

				// Build colors and CSS dynamically from CSS variables
				const overrides = buildChartOverrides();
				const loadingColors = getLoadingScreenColors();
				const toolbarBg = getToolbarBgColor();
				const customCssUrl = await generateChartCssUrl();
				const themeColors = getCustomThemeColors();
				cssUrlRef.current = customCssUrl;

				widgetRef.current = new window.TradingView.widget({
					container: containerRef.current,
					library_path: CHART_LIBRARY_PATH,
					datafeed: createDatafeed() as unknown as IBasicDataFeed,
					symbol: symbol,
					interval: interval as ResolutionString,
					locale: "en",
					fullscreen: false,
					autosize: true,
					theme: theme,
					timezone: TIMEZONE,
					debug: false,
					custom_font_family: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
					time_frames: CHART_TIME_FRAMES,
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
					loading_screen: loadingColors,
					toolbar_bg: toolbarBg,
					custom_css_url: customCssUrl,
					custom_themes: {
						dark: themeColors,
						light: themeColors,
					},
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
			if (cssUrlRef.current) {
				URL.revokeObjectURL(cssUrlRef.current);
				cssUrlRef.current = null;
			}
		};
	}, [symbol, interval, theme]);

	return (
		<div className="relative w-full h-full" style={{ minHeight: "300px" }}>
			<div ref={containerRef} className="w-full h-full" />
			{/* Scanlines overlay to match terminal aesthetic */}
			<div className="pointer-events-none absolute inset-0 terminal-scanlines" />
		</div>
	);
}
