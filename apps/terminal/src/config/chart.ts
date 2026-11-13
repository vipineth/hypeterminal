import type { CandleType } from "klinecharts";
import type { ChartingLibraryFeatureset, ResolutionString, TimeFrameItem } from "@/types/charting_library";

export const CHART_LIBRARY_PATH = "/charting_library/";

export const CHART_TIME_FRAMES: TimeFrameItem[] = [
	{ text: "5y", resolution: "1W" as ResolutionString, description: "5 Years" },
	{ text: "1y", resolution: "1D" as ResolutionString, description: "1 Year" },
	{ text: "3m", resolution: "240" as ResolutionString, description: "3 Months" },
	{ text: "1m", resolution: "60" as ResolutionString, description: "1 Month" },
	{ text: "5d", resolution: "15" as ResolutionString, description: "5 Days" },
	{ text: "1d", resolution: "5" as ResolutionString, description: "1 Day" },
];

export const CHART_DEFAULT_SYMBOL = "AAVE/USDC";
export const CHART_DEFAULT_INTERVAL = "60";
export const CHART_DEFAULT_THEME = "dark" as const;
export const CHART_EXCHANGE = "Hyperliquid";
export const CHART_SESSION = "24x7";
export const CHART_TIMEZONE = "Etc/UTC";
export const CHART_DEFAULT_PRICESCALE = 100;

export const CHART_SUPPORTED_RESOLUTIONS = [
	"1",
	"3",
	"5",
	"15",
	"30",
	"60",
	"120",
	"240",
	"480",
	"720",
	"1D",
	"1W",
	"1M",
] as unknown as ResolutionString[];

export const CHART_LOCALE = "en";
export const CHART_CUSTOM_FONT_FAMILY = "'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif";

export const CHART_ENABLED_FEATURES = [
	"side_toolbar_in_fullscreen_mode",
	"header_in_fullscreen_mode",
	"hide_last_na_study_output",
	"constraint_dialogs_to_chart",
	"dont_show_boolean_study_arguments",
	"hide_resolution_in_legend",
	"items_favoriting",
	"save_shortcut",
] as ChartingLibraryFeatureset[];

export const CHART_DISABLED_FEATURES = [
	"header_symbol_search",
	"header_quick_search",
	"header_compare",
	"display_market_status",
	"popup_hints",
	"header_saveload",
	"header_screenshot",
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
] as ChartingLibraryFeatureset[];

export const CHART_FAVORITE_INTERVALS = ["1", "5", "60", "240", "1D"] as ResolutionString[];

export const CHART_WIDGET_DEFAULTS = {
	AUTOSIZE: true,
	FULLSCREEN: false,
	DEBUG: false,
} as const;

export const CHART_DATAFEED_CONFIG = {
	SYMBOL_TYPE: "crypto",
	SYMBOL_TYPES: [{ name: "crypto", value: "crypto" }],
	DATA_STATUS: "streaming",
	FORMAT: "price",
	MIN_MOVEMENT: 1,
	VOLUME_PRECISION: 2,
	SEARCH_LIMIT: 50,
} as const;

export const CHART_TYPES = [
	{ label: "Candles", type: "candle_solid" as CandleType },
	{ label: "Hollow", type: "candle_stroke" as CandleType },
	{ label: "OHLC", type: "ohlc" as CandleType },
	{ label: "Area", type: "area" as CandleType },
] as const;

export type ChartTypeConfig = (typeof CHART_TYPES)[number];

export const DEFAULT_CHART_TYPE = CHART_TYPES[0];

export const INITIAL_CANDLE_COUNT = 500;
export const VOLUME_INDICATOR_NAME = "VOL";

export const CHART_MIN_HEIGHT_PX = 300;

export const SHORT_MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;
