import { t } from "@lingui/core/macro";
import { createColumnHelper } from "@tanstack/react-table";
import { get24hChange, getOiUsd } from "@/domain/market";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";

export type MarketScope = "all" | "perp" | "spot" | "hip3";

export type MarketRow = UnifiedMarketInfo;

const columnHelper = createColumnHelper<MarketRow>();

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("pairName", {
		header: t`Market`,
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor("markPx", {
		id: "price",
		header: t`Price`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row: MarketRow) => get24hChange(row.prevDayPx, row.markPx) ?? 0, {
		id: "24h-change",
		header: t`24h Change`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row: MarketRow) => getOiUsd(row.openInterest, row.markPx) ?? 0, {
		id: "oi",
		header: t`Open Interest`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor("dayNtlVlm", {
		id: "volume",
		header: t`Volume`,
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor("funding", {
		id: "funding",
		header: t`Funding`,
		size: 80,
		enableSorting: true,
	}),
];
