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
} from "@/constants/app";
import type { PerpMarketInfo } from "@/lib/hyperliquid/market-registry";
import type { MarketCtxNumbers } from "@/lib/market";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import type { PerpAssetCtx } from "@/types/hyperliquid";

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
	ctxNumbers: MarketCtxNumbers | null;
};

const columnHelper = createColumnHelper<MarketRow>();

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("coin", {
		header: t`Market`,
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor((row) => row.ctxNumbers?.markPx ?? 0, {
		id: "price",
		header: t`Price`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculate24hPriceChange(row.ctxNumbers) ?? 0, {
		id: "24h-change",
		header: t`24h Price`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculateOpenInterestUSD(row.ctxNumbers) ?? 0, {
		id: "oi",
		header: t`Open Interest`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => row.ctxNumbers?.dayNtlVlm ?? 0, {
		id: "volume",
		header: t`Volume`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => row.ctxNumbers?.funding ?? 0, {
		id: "funding",
		header: t`Funding`,
		size: 80,
		enableSorting: true,
	}),
];
