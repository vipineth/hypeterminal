import { createColumnHelper } from "@tanstack/react-table";
import {
	CHART_ALL_MIDS_TTL_MS,
	CHART_CUSTOM_FONT_FAMILY,
	CHART_DATAFEED_CONFIG,
	CHART_DEFAULT_INTERVAL,
	CHART_DEFAULT_PRICESCALE,
	CHART_DEFAULT_SYMBOL,
	CHART_DEFAULT_THEME,
	CHART_EXCHANGE,
	CHART_FAVORITE_INTERVALS,
	CHART_LOCALE,
	CHART_DISABLED_FEATURES,
	CHART_ENABLED_FEATURES,
	CHART_WIDGET_DEFAULTS,
	CHART_LIBRARY_PATH,
	CHART_QUOTE_ASSET,
	CHART_SESSION,
	CHART_SUPPORTED_RESOLUTIONS,
	CHART_TIME_FRAMES,
	CHART_TIMEZONE,
	UI_TEXT,
} from "@/constants/app";
import type { PerpAssetCtx } from "@/types/hyperliquid";
import type { PerpMarketInfo } from "@/lib/hyperliquid/market-registry";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";

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

export type MarketRow = PerpMarketInfo & {
	ctx: PerpAssetCtx | undefined;
};

const columnHelper = createColumnHelper<MarketRow>();

const TOKEN_SELECTOR_TEXT = UI_TEXT.TOKEN_SELECTOR;

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("coin", {
		header: TOKEN_SELECTOR_TEXT.HEADER_MARKET,
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor((row) => (row.ctx?.markPx ? Number(row.ctx.markPx) : 0), {
		id: "price",
		header: TOKEN_SELECTOR_TEXT.HEADER_PRICE,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculate24hPriceChange(row.ctx) ?? 0, {
		id: "24h-change",
		header: TOKEN_SELECTOR_TEXT.HEADER_CHANGE_24H,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculateOpenInterestUSD(row.ctx) ?? 0, {
		id: "oi",
		header: TOKEN_SELECTOR_TEXT.HEADER_OPEN_INTEREST,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.ctx?.dayNtlVlm ? Number(row.ctx.dayNtlVlm) : 0), {
		id: "volume",
		header: TOKEN_SELECTOR_TEXT.HEADER_VOLUME,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.ctx?.funding ? Number.parseFloat(row.ctx.funding) : 0), {
		id: "funding",
		header: TOKEN_SELECTOR_TEXT.HEADER_FUNDING,
		size: 80,
		enableSorting: true,
	}),
];
