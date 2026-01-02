import { getCoreRowModel, type Row, type SortingState, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isTokenInCategory, type MarketCategory } from "@/config/token";
import { usePerpMarketRegistry } from "@/hooks/hyperliquid/use-market-registry";
import { usePerpAssetCtxsSnapshot } from "@/hooks/hyperliquid/use-perp-asset-ctxs-snapshot";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import { useFavoriteMarketKeys, useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { type MarketRow, TOKEN_SELECTOR_COLUMNS } from "./constants";

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
	isFavorite: (coin: string) => boolean;
	sorting: SortingState;
	handleSelect: (coin: string) => void;
	handleCategorySelect: (cat: MarketCategory) => void;
	toggleFavorite: (coin: string) => void;
	table: ReturnType<typeof useReactTable<MarketRow>>;
	rows: Row<MarketRow>[];
	virtualizer: Virtualizer<HTMLDivElement, Element>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	filteredMarkets: MarketRow[];
}

export function useTokenSelector({ onValueChange }: UseTokenSelectorOptions): UseTokenSelectorReturn {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<MarketCategory>("all");
	const [search, setSearch] = useState("");
	const { registry, isLoading } = usePerpMarketRegistry();
	const ctxs = usePerpAssetCtxsSnapshot({ enabled: open, intervalMs: 10_000 });
	const favorites = useFavoriteMarketKeys();
	const { toggleFavoriteMarketKey } = useMarketPrefsActions();

	const markets = useMemo((): MarketRow[] => {
		if (!registry) return [];
		return Array.from(registry.marketKeyToInfo.values()).map((marketInfo) => ({
			...marketInfo,
			ctx: ctxs?.[marketInfo.assetIndex],
		}));
	}, [registry, ctxs]);

	const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

	const isFavorite = useCallback(
		(coin: string): boolean => {
			return favoriteSet.has(makePerpMarketKey(coin));
		},
		[favoriteSet],
	);

	const toggleFavorite = useCallback(
		(coin: string) => {
			toggleFavoriteMarketKey(makePerpMarketKey(coin));
		},
		[toggleFavoriteMarketKey],
	);

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

	const handleSortingChange = useCallback((updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
		setSorting(updaterOrValue);
	}, []);

	const sortedMarkets = useMemo(() => {
		const favoriteMarkets = filteredMarkets.filter((m) => isFavorite(m.coin));
		const nonFavoriteMarkets = filteredMarkets.filter((m) => !isFavorite(m.coin));

		function getSortValue(market: MarketRow, columnId: string): number {
			switch (columnId) {
				case "price":
					return market.ctx?.markPx ? Number(market.ctx.markPx) : 0;
				case "24h-change":
					return calculate24hPriceChange(market.ctx) ?? 0;
				case "oi":
					return calculateOpenInterestUSD(market.ctx) ?? 0;
				case "volume":
					return market.ctx?.dayNtlVlm ? Number(market.ctx.dayNtlVlm) : 0;
				case "funding":
					return market.ctx?.funding ? Number.parseFloat(market.ctx.funding) : 0;
				default:
					return 0;
			}
		}

		function sortSection(section: MarketRow[]): MarketRow[] {
			if (sorting.length === 0) return section;

			const { id, desc } = sorting[0];
			return [...section].sort((a, b) => {
				const aVal = getSortValue(a, id);
				const bVal = getSortValue(b, id);
				return desc ? bVal - aVal : aVal - bVal;
			});
		}

		return [...sortSection(favoriteMarkets), ...sortSection(nonFavoriteMarkets)];
	}, [filteredMarkets, isFavorite, sorting]);

	const table = useReactTable({
		data: sortedMarkets,
		columns: TOKEN_SELECTOR_COLUMNS,
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		state: { sorting },
		onSortingChange: handleSortingChange,
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
		isLoading: open && (isLoading || !registry),
		isFavorite,
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
