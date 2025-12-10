import { createColumnHelper, getCoreRowModel, type Row, type SortingState, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { isTokenInCategory, type MarketCategory } from "@/config/token";
import { useMarkets } from "@/hooks/hyperliquid";
import { useFavorites, useFavoritesActions } from "@/stores/use-favorites-store";

export type Market = {
	coin: string;
	name: string;
	markPrice: string | undefined;
	indexPrice: string | undefined;
	fundingRate: string | undefined;
	openInterest: string | undefined;
	volume24h: string | undefined;
	maxLeverage: number;
	szDecimals: number;
	isDelisted?: boolean;
};

const columnHelper = createColumnHelper<Market>();

const columns = [
	columnHelper.accessor("coin", {
		header: "Market",
		size: 160,
		enableSorting: false,
	}),
	columnHelper.accessor((row) => (row.markPrice ? Number(row.markPrice) : 0), {
		id: "price",
		header: "Price",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.openInterest ? Number(row.openInterest) : 0), {
		id: "oi",
		header: "Open Interest",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.volume24h ? Number(row.volume24h) : 0), {
		id: "volume",
		header: "Volume",
		size: 80,
		enableSorting: true,
	}),
	columnHelper.accessor((row) => (row.fundingRate ? Number.parseFloat(row.fundingRate) : 0), {
		id: "funding",
		header: "Funding",
		size: 80,
		enableSorting: true,
	}),
];

export interface UseTokenSelectorOptions {
	value: string;
	onValueChange: (value: string) => void;
}

export interface UseTokenSelectorReturn {
	open: boolean;
	setOpen: (open: boolean) => void;
	category: MarketCategory;
	search: string;
	setSearch: (search: string) => void;
	isLoading: boolean;
	favorites: string[];
	sorting: SortingState;
	handleSelect: (coin: string) => void;
	handleCategorySelect: (cat: MarketCategory) => void;
	toggleFavorite: (coin: string) => void;
	table: ReturnType<typeof useReactTable<Market>>;
	rows: Row<Market>[];
	virtualizer: Virtualizer<HTMLDivElement, Element>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	filteredMarkets: Market[];
}

export function useTokenSelector({ onValueChange }: UseTokenSelectorOptions): UseTokenSelectorReturn {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<MarketCategory>("all");
	const [search, setSearch] = useState("");
	const { data: markets, isLoading } = useMarkets();
	const favorites = useFavorites();
	const { toggleFavorite } = useFavoritesActions();

	const filteredMarkets = useMemo(() => {
		if (!markets) return [];

		return markets.filter((market) => {
			if (search && !market.coin.toLowerCase().includes(search.toLowerCase())) {
				return false;
			}
			return isTokenInCategory(market.coin, category);
		});
	}, [markets, category, search]);

	const containerRef = useRef<HTMLDivElement>(null);
	const [sorting, setSorting] = useState<SortingState>([]);

	const sortedMarkets = useMemo(() => {
		const favoriteMarkets = filteredMarkets.filter((m) => favorites.includes(m.coin));
		const nonFavoriteMarkets = filteredMarkets.filter((m) => !favorites.includes(m.coin));

		function getSortValue(market: Market, columnId: string): number {
			switch (columnId) {
				case "price":
					return market.markPrice ? Number(market.markPrice) : 0;
				case "oi":
					return market.openInterest ? Number(market.openInterest) : 0;
				case "volume":
					return market.volume24h ? Number(market.volume24h) : 0;
				case "funding":
					return market.fundingRate ? Number.parseFloat(market.fundingRate) : 0;
				default:
					return 0;
			}
		}

		function sortSection(section: Market[]): Market[] {
			if (sorting.length === 0) return section;

			const { id, desc } = sorting[0];
			return [...section].sort((a, b) => {
				const aVal = getSortValue(a, id);
				const bVal = getSortValue(b, id);
				return desc ? bVal - aVal : aVal - bVal;
			});
		}

		return [...sortSection(favoriteMarkets), ...sortSection(nonFavoriteMarkets)];
	}, [filteredMarkets, favorites, sorting]);

	const table = useReactTable({
		data: sortedMarkets,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		state: { sorting },
		onSortingChange: setSorting,
		enableSorting: true,
	});

	const { rows } = table.getRowModel();

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => containerRef.current,
		estimateSize: () => 48,
		overscan: 10,
	});

	useEffect(() => {
		if (open) {
			virtualizer.measure();
			queueMicrotask(() => virtualizer.measure());
			const rafId = requestAnimationFrame(() => virtualizer.measure());
			return () => cancelAnimationFrame(rafId);
		}
	}, [open, virtualizer]);

	function handleSelect(coin: string) {
		onValueChange(coin);
		setOpen(false);
		setSearch("");
	}

	function handleCategorySelect(cat: MarketCategory) {
		setCategory(cat);
	}

	return {
		open,
		setOpen,
		category,
		search,
		setSearch,
		isLoading,
		favorites,
		sorting,
		handleSelect,
		handleCategorySelect,
		toggleFavorite,
		table,
		rows,
		virtualizer,
		containerRef,
		filteredMarkets,
	};
}
