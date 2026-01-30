import { t } from "@lingui/core/macro";
import { createColumnHelper } from "@tanstack/react-table";
import {
	CHART_ALL_MIDS_TTL_MS,
	CHART_CUSTOM_FONT_FAMILY,
	CHART_DATAFEED_CONFIG,
	CHART_DEFAULT_INTERVAL,
	CHART_DEFAULT_PRICESCALE,
	CHART_DEFAULT_SYMBOL,
	CHART_DEFAULT_THEME,
	CHART_DISABLED_FEATURES,
	CHART_ENABLED_FEATURES,
	CHART_EXCHANGE,
	CHART_FAVORITE_INTERVALS,
	CHART_LIBRARY_PATH,
	CHART_LOCALE,
	CHART_QUOTE_ASSET,
	CHART_SESSION,
	CHART_SUPPORTED_RESOLUTIONS,
	CHART_TIME_FRAMES,
	CHART_TIMEZONE,
	CHART_WIDGET_DEFAULTS,
} from "@/config/constants";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/domain/market";

export {
	CHART_LIBRARY_PATH,
	CHART_TIME_FRAMES,
	CHART_DEFAULT_SYMBOL as DEFAULT_CHART_SYMBOL,
	CHART_DEFAULT_INTERVAL as DEFAULT_CHART_INTERVAL,
	CHART_DEFAULT_THEME as DEFAULT_CHART_THEME,
	CHART_LOCALE,
	CHART_CUSTOM_FONT_FAMILY,
	CHART_ENABLED_FEATURES,
	CHART_DISABLED_FEATURES,
	CHART_FAVORITE_INTERVALS,
	CHART_WIDGET_DEFAULTS,
	CHART_EXCHANGE as EXCHANGE,
	CHART_QUOTE_ASSET as QUOTE_ASSET,
	CHART_SESSION as SESSION_24X7,
	CHART_TIMEZONE as TIMEZONE,
	CHART_DEFAULT_PRICESCALE as DEFAULT_PRICESCALE,
	CHART_SUPPORTED_RESOLUTIONS as SUPPORTED_RESOLUTIONS,
	CHART_ALL_MIDS_TTL_MS as ALL_MIDS_TTL_MS,
	CHART_DATAFEED_CONFIG,
};

export type MarketScope = "all" | "perp" | "spot" | "hip3";

export type MarketRow = UnifiedMarketInfo;

const columnHelper = createColumnHelper<MarketRow>();

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("displayName", {
		header: t`Market`,
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor((row) => row.markPx ?? 0, {
		id: "price",
		header: t`Price`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculate24hPriceChange(row.prevDayPx, row.markPx) ?? 0, {
		id: "24h-change",
		header: t`24h Change`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculateOpenInterestUSD(row.openInterest, row.markPx) ?? 0, {
		id: "oi",
		header: t`Open Interest`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => row.dayNtlVlm ?? 0, {
		id: "volume",
		header: t`Volume`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => row.funding ?? 0, {
		id: "funding",
		header: t`Funding`,
		size: 80,
		enableSorting: true,
	}),
];
