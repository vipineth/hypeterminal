import { getCoreRowModel, type Row, type SortingState, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { isTokenInCategory, type MarketCategory } from "@/lib/tokens";
import { useFavoriteMarkets, useMarketActions } from "@/stores/use-market-store";
import { type MarketRow, type MarketScope, TOKEN_SELECTOR_COLUMNS } from "./constants";

export interface Subcategory {
	value: string;
	label: string;
}

export interface UseTokenSelectorOptions {
	value: string;
	onValueChange: (value: string) => void;
}

export interface UseTokenSelectorReturn {
	open: boolean;
	setOpen: (open: boolean) => void;
	scope: MarketScope;
	subcategory: string;
	subcategories: Subcategory[];
	search: string;
	setSearch: (search: string) => void;
	isLoading: boolean;
	isFavorite: (name: string) => boolean;
	sorting: SortingState;
	handleSelect: (name: string) => void;
	handleSubcategorySelect: (sub: string) => void;
	handleScopeSelect: (scope: MarketScope) => void;
	toggleFavorite: (name: string) => void;
	table: ReturnType<typeof useReactTable<MarketRow>>;
	rows: Row<MarketRow>[];
	virtualizer: Virtualizer<HTMLDivElement, Element>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	filteredMarkets: MarketRow[];
}

function getBaseCoin(market: MarketRow): string {
	if (market.kind === "spot") return market.displayName.split("/")[0];
	return market.displayName.split("-")[0] ?? market.displayName;
}

function getSortValue(market: MarketRow, columnId: string): number {
	switch (columnId) {
		case "price":
			return market.markPx ?? 0;
		case "24h-change": {
			const { markPx, prevDayPx } = market;
			if (!markPx || !prevDayPx || prevDayPx === 0) return 0;
			return ((markPx - prevDayPx) / prevDayPx) * 100;
		}
		case "oi":
			return (market.openInterest ?? 0) * (market.markPx ?? 0);
		case "volume":
			return market.dayNtlVlm ?? 0;
		case "funding":
			return market.funding ?? 0;
		default:
			return 0;
	}
}

const PERP_CATEGORIES: Subcategory[] = [
	{ value: "all", label: "All" },
	{ value: "trending", label: "Trending" },
	{ value: "new", label: "New" },
	{ value: "defi", label: "DeFi" },
	{ value: "layer1", label: "L1" },
	{ value: "layer2", label: "L2" },
	{ value: "meme", label: "Meme" },
];

export function useTokenSelector({ onValueChange }: UseTokenSelectorOptions): UseTokenSelectorReturn {
	const [open, setOpen] = useState(false);
	const [scope, setScope] = useState<MarketScope>("all");
	const [subcategory, setSubcategory] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([{ id: "volume", desc: true }]);
	const containerRef = useRef<HTMLDivElement>(null);

	const { markets, spotMarkets, builderPerpMarkets, isLoading } = useMarketsInfo();
	const favorites = useFavoriteMarkets();
	const { toggleFavoriteMarket } = useMarketActions();

	const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
	const isFavorite = useCallback((name: string) => favoriteSet.has(name), [favoriteSet]);

	const subcategories = useMemo((): Subcategory[] => {
		if (scope === "all") return [];
		if (scope === "perp") return PERP_CATEGORIES;

		if (scope === "spot") {
			const quoteTokens = new Set<string>();
			for (const market of spotMarkets) {
				const quoteToken = market.tokensInfo[1]?.name;
				if (quoteToken) quoteTokens.add(quoteToken);
			}
			return [{ value: "all", label: "All" }, ...Array.from(quoteTokens).map((t) => ({ value: t, label: t }))];
		}

		if (scope === "hip3") {
			const dexNames = Object.keys(builderPerpMarkets).filter((k) => k !== "all");
			return [{ value: "all", label: "All" }, ...dexNames.map((d) => ({ value: d, label: d }))];
		}

		return [];
	}, [scope, spotMarkets, builderPerpMarkets]);

	const handleScopeSelect = useCallback((newScope: MarketScope) => {
		setScope(newScope);
		setSubcategory("all");
	}, []);

	const filteredMarkets = useMemo(() => {
		return markets.filter((market) => {
			if (scope === "perp" && market.kind !== "perp") return false;
			if (scope === "spot" && market.kind !== "spot") return false;
			if (scope === "hip3" && market.kind !== "builderPerp") return false;
			if (search && !market.displayName.toLowerCase().includes(search.toLowerCase())) return false;

			if (subcategory === "all") return true;

			if (scope === "perp") {
				return isTokenInCategory(getBaseCoin(market), subcategory as MarketCategory);
			}

			if (scope === "spot" && market.kind === "spot") {
				const quoteToken = market.tokensInfo[1]?.name;
				return quoteToken === subcategory;
			}

			if (scope === "hip3" && market.kind === "builderPerp") {
				return market.dex === subcategory;
			}

			return true;
		});
	}, [markets, scope, subcategory, search]);

	const sortedMarkets = useMemo(() => {
		const favoriteMarkets = filteredMarkets.filter((m) => isFavorite(m.name));
		const nonFavoriteMarkets = filteredMarkets.filter((m) => !isFavorite(m.name));

		function sortSection(section: MarketRow[]): MarketRow[] {
			if (sorting.length === 0) return section;
			const { id, desc } = sorting[0];
			return [...section].sort((a, b) => {
				const diff = getSortValue(a, id) - getSortValue(b, id);
				return desc ? -diff : diff;
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

	function handleSelect(name: string) {
		onValueChange(name);
		setOpen(false);
		setSearch("");
	}

	return {
		open,
		setOpen,
		scope,
		subcategory,
		subcategories,
		search,
		setSearch,
		isLoading: open && isLoading,
		isFavorite,
		sorting,
		handleSelect,
		handleSubcategorySelect: setSubcategory,
		handleScopeSelect,
		toggleFavorite: toggleFavoriteMarket,
		table,
		rows,
		virtualizer,
		containerRef,
		filteredMarkets,
	};
}
