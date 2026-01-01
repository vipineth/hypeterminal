import { createColumnHelper } from "@tanstack/react-table";
import type { PerpAssetCtx } from "@/hooks/hyperliquid/use-perp-asset-ctxs-snapshot";
import type { PerpMarketInfo } from "@/lib/hyperliquid";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import type { ResolutionString, TimeFrameItem } from "@/types/charting_library";

export const CHART_LIBRARY_PATH = "https://cdn.asgard.finance/charting_library-28.3.0/";

export const CHART_TIME_FRAMES: TimeFrameItem[] = [
	{ text: "5y", resolution: "1W" as ResolutionString, description: "5 Years" },
	{ text: "1y", resolution: "1D" as ResolutionString, description: "1 Year" },
	{ text: "3m", resolution: "240" as ResolutionString, description: "3 Months" },
	{ text: "1m", resolution: "60" as ResolutionString, description: "1 Month" },
	{ text: "5d", resolution: "15" as ResolutionString, description: "5 Days" },
	{ text: "1d", resolution: "5" as ResolutionString, description: "1 Day" },
];

export const DEFAULT_CHART_SYMBOL = "AAVE/USDC";
export const DEFAULT_CHART_INTERVAL = "60";
export const DEFAULT_CHART_THEME = "dark" as const;

export const EXCHANGE = "Hyperliquid";
export const QUOTE_ASSET = "USDC";
export const SESSION_24X7 = "24x7";
export const TIMEZONE = "Etc/UTC";
export const DEFAULT_PRICESCALE = 100;

export const SUPPORTED_RESOLUTIONS = [
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

export const ALL_MIDS_TTL_MS = 10_000;

export type MarketRow = PerpMarketInfo & {
	ctx: PerpAssetCtx | undefined;
};

const columnHelper = createColumnHelper<MarketRow>();

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("coin", {
		header: "Market",
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor((row) => (row.ctx?.markPx ? Number(row.ctx.markPx) : 0), {
		id: "price",
		header: "Price",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculate24hPriceChange(row.ctx) ?? 0, {
		id: "24h-change",
		header: "24h Price",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => calculateOpenInterestUSD(row.ctx) ?? 0, {
		id: "oi",
		header: "Open Interest",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.ctx?.dayNtlVlm ? Number(row.ctx.dayNtlVlm) : 0), {
		id: "volume",
		header: "Volume",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.ctx?.funding ? Number.parseFloat(row.ctx.funding) : 0), {
		id: "funding",
		header: "Funding",
		size: 80,
		enableSorting: true,
	}),
];
