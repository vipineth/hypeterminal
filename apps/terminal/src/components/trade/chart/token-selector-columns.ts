import { t } from "@lingui/core/macro";
import { createColumnHelper, type SortingFn } from "@tanstack/react-table";
import { get24hChange, getOiUsd } from "@/domain/market";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";

export type MarketScope = "all" | "perp" | "spot" | "hip3";

export type MarketRow = UnifiedMarketInfo;

const TOKEN_SELECTOR_MOBILE_24H_CHANGE_WIDTH = "w-[7.25rem]";
const TOKEN_SELECTOR_MOBILE_PRICE_WIDTH = "w-[4.75rem]";

const columnHelper = createColumnHelper<MarketRow>();

const numericStringSortFn: SortingFn<MarketRow> = (rowA, rowB, columnId) => {
	const a = Number(rowA.getValue(columnId));
	const b = Number(rowB.getValue(columnId));
	if (Number.isNaN(a) || Number.isNaN(b)) return 0;
	return a - b;
};

export function getMarketTableColumnClass(columnId: string, mobile: boolean): string {
	if (mobile) {
		switch (columnId) {
			case "24h-change":
				return TOKEN_SELECTOR_MOBILE_24H_CHANGE_WIDTH;
			case "price":
				return TOKEN_SELECTOR_MOBILE_PRICE_WIDTH;
			default:
				return "w-20";
		}
	}
	switch (columnId) {
		case "price":
			return "w-16 sm:w-20";
		case "24h-change":
			return "w-28 shrink-0";
		case "oi":
			return "w-32 shrink-0";
		case "volume":
		case "funding":
			return "w-20 sm:w-24 shrink-0";
		default:
			return "w-16 sm:w-20";
	}
}

export const TOKEN_SELECTOR_COLUMNS = [
	columnHelper.accessor("pairName", {
		header: t`Market`,
		size: 220,
		enableSorting: false,
	}),
	columnHelper.accessor("markPx", {
		id: "price",
		header: t`Price`,
		size: 80,
		sortUndefined: "last",
		sortingFn: numericStringSortFn,
	}),
	columnHelper.accessor((row: MarketRow) => get24hChange(row.prevDayPx, row.markPx) ?? undefined, {
		id: "24h-change",
		header: t`24h Change`,
		size: 112,
		sortUndefined: "last",
	}),
	columnHelper.accessor((row: MarketRow) => getOiUsd(row.openInterest, row.markPx) ?? undefined, {
		id: "oi",
		header: t`Open Interest`,
		size: 128,
		sortUndefined: "last",
	}),
	columnHelper.accessor("dayNtlVlm", {
		id: "volume",
		header: t`Volume`,
		size: 80,
		sortUndefined: "last",
		sortingFn: numericStringSortFn,
	}),
	columnHelper.accessor("funding", {
		id: "funding",
		header: t`Funding`,
		size: 80,
		sortUndefined: "last",
		sortingFn: numericStringSortFn,
	}),
];
