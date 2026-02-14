import { useEffect, useRef } from "react";
import type { IChartingLibraryWidget, ResolutionString } from "@/types/charting_library";
import {
	CHART_CUSTOM_FONT_FAMILY,
	CHART_DISABLED_FEATURES,
	CHART_ENABLED_FEATURES,
	CHART_FAVORITE_INTERVALS,
	CHART_LIBRARY_PATH,
	CHART_LOCALE,
	CHART_TIME_FRAMES,
	CHART_WIDGET_DEFAULTS,
	DEFAULT_CHART_INTERVAL,
	DEFAULT_CHART_SYMBOL,
	DEFAULT_CHART_THEME,
	TIMEZONE,
} from "./constants";
import { createDatafeed } from "./datafeed";
import { buildChartOverrides, generateChartCssUrl, getLoadingScreenColors, getToolbarBgColor } from "./theme-colors";

interface Props {
	symbol?: string;
	interval?: string;
	theme?: "light" | "dark";
	extraDisabledFeatures?: string[];
}

export function TradingViewChart({
	symbol = DEFAULT_CHART_SYMBOL,
	interval = DEFAULT_CHART_INTERVAL,
	theme = DEFAULT_CHART_THEME,
	extraDisabledFeatures,
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<IChartingLibraryWidget | null>(null);
	const scriptLoadedRef = useRef(false);
	const cssUrlRef = useRef<string | null>(null);
	const chartReadyRef = useRef(false);

	useEffect(() => {
		if (!containerRef.current) return;
		chartReadyRef.current = false;

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
							clearTimeout(timeout);
							resolve();
						}
					}, 100);

					const timeout = setTimeout(() => {
						clearInterval(checkInterval);
						reject(new Error("TradingView library load timeout"));
					}, 10000);
					return;
				}

				scriptLoadedRef.current = true;
				const script = document.createElement("script");
				script.src = `${CHART_LIBRARY_PATH}charting_library.js`;
				script.async = true;

				const timeout = setTimeout(() => {
					script.remove();
					reject(new Error("Script load timeout"));
				}, 30000);

				script.onload = () => {
					clearTimeout(timeout);
					resolve();
				};

				script.onerror = () => {
					clearTimeout(timeout);
					reject(new Error("Failed to load TradingView library"));
				};

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

				if (cssUrlRef.current) {
					URL.revokeObjectURL(cssUrlRef.current);
				}

				const overrides = buildChartOverrides();
				const loadingColors = getLoadingScreenColors();
				const toolbarBg = getToolbarBgColor();
				const customCssUrl = await generateChartCssUrl();
				cssUrlRef.current = customCssUrl;

				widgetRef.current = new window.TradingView.widget({
					container: containerRef.current,
					library_path: CHART_LIBRARY_PATH,
					datafeed: createDatafeed(),
					symbol: symbol,
					interval: interval as ResolutionString,
					locale: CHART_LOCALE,
					fullscreen: CHART_WIDGET_DEFAULTS.FULLSCREEN,
					autosize: CHART_WIDGET_DEFAULTS.AUTOSIZE,
					theme: theme,
					timezone: TIMEZONE,
					debug: CHART_WIDGET_DEFAULTS.DEBUG,
					custom_font_family: CHART_CUSTOM_FONT_FAMILY,
					time_frames: CHART_TIME_FRAMES,
					enabled_features: CHART_ENABLED_FEATURES,
					disabled_features: extraDisabledFeatures
						? ([...CHART_DISABLED_FEATURES, ...extraDisabledFeatures] as typeof CHART_DISABLED_FEATURES)
						: CHART_DISABLED_FEATURES,
					overrides: overrides,
					loading_screen: loadingColors,
					toolbar_bg: toolbarBg,
					custom_css_url: customCssUrl,
					studies_overrides: {},
					favorites: {
						intervals: CHART_FAVORITE_INTERVALS,
					},
				});

				widgetRef.current.onChartReady(() => {
					chartReadyRef.current = true;
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
			chartReadyRef.current = false;
			if (cssUrlRef.current) {
				URL.revokeObjectURL(cssUrlRef.current);
				cssUrlRef.current = null;
			}
		};
	}, [symbol, interval, theme, extraDisabledFeatures]);

	return (
		<div className="relative w-full h-full" style={{ minHeight: "300px" }}>
			<div ref={containerRef} className="w-full h-full" />
		</div>
	);
}
