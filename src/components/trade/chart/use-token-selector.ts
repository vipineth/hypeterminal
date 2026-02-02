import { getCoreRowModel, type Row, type SortingState, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import Big from "big.js";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { get24hChange, getOiUsd, isTokenInCategory, type MarketCategory } from "@/domain/market";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { createSearcher } from "@/lib/search";
import { marketSearchConfig } from "@/lib/search/presets/market";
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
	highlightedIndex: number;
	handleKeyDown: (e: React.KeyboardEvent) => void;
}

function getBaseCoin(market: MarketRow): string {
	if (market.kind === "spot") return market.displayName.split("/")[0];
	return market.displayName.split("-")[0] ?? market.displayName;
}

function getSortValue(market: MarketRow, columnId: string): string {
	switch (columnId) {
		case "price":
			return market.markPx?.toString() ?? "0";
		case "24h-change":
			return (get24hChange(market.prevDayPx, market.markPx) ?? 0).toString();
		case "oi":
			return (getOiUsd(market.openInterest, market.markPx) ?? 0).toString();
		case "volume":
			return market.dayNtlVlm?.toString() ?? "0";
		case "funding":
			return market.funding?.toString() ?? "0";
		default:
			return "0";
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

export function useTokenSelector({ value, onValueChange }: UseTokenSelectorOptions): UseTokenSelectorReturn {
	const [open, setOpen] = useState(false);
	const [scope, setScope] = useState<MarketScope>("all");
	const [subcategory, setSubcategory] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [deferredSearch, setDeferredSearch] = useState("");
	const [isPending, startTransition] = useTransition();
	const [sorting, setSorting] = useState<SortingState>([{ id: "volume", desc: true }]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const hasInitializedRef = useRef(false);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value);
		startTransition(() => setDeferredSearch(value));
	}, []);

	const { markets, spotMarkets, builderPerpMarkets, isLoading } = useMarketsInfo();

	const favorites = useFavoriteMarkets();
	const { toggleFavoriteMarket } = useMarketActions();

	const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
	const isFavorite = useCallback((name: string) => favoriteSet.has(name), [favoriteSet]);

	const subcategories = useMemo((): Subcategory[] => {
		if (scope === "all") return [];
		if (scope === "perp") return PERP_CATEGORIES;

		if (scope === "spot") {
			const quoteTokens = new Map<string, string>();
			for (const market of spotMarkets) {
				const quoteToken = market.tokensInfo[1];
				if (quoteToken?.name && !quoteTokens.has(quoteToken.name)) {
					quoteTokens.set(quoteToken.name, quoteToken.displayName);
				}
			}
			return [
				{ value: "all", label: "All" },
				...Array.from(quoteTokens.entries()).map(([name, displayName]) => ({
					value: name,
					label: displayName,
				})),
			];
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

	const scopeFilteredMarkets = useMemo(() => {
		return markets.filter((market) => {
			if (scope === "perp" && market.kind !== "perp") return false;
			if (scope === "spot" && market.kind !== "spot") return false;
			if (scope === "hip3" && market.kind !== "builderPerp") return false;

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
	}, [markets, scope, subcategory]);

	const searcher = useMemo(() => createSearcher(scopeFilteredMarkets, marketSearchConfig), [scopeFilteredMarkets]);

	const filteredMarkets = useMemo(() => {
		if (!deferredSearch) return scopeFilteredMarkets;
		return searcher.search(deferredSearch).map((result) => result.item);
	}, [scopeFilteredMarkets, searcher, deferredSearch]);

	const sortedMarkets = useMemo(() => {
		const favoriteMarkets = filteredMarkets.filter((m) => isFavorite(m.name));
		const nonFavoriteMarkets = filteredMarkets.filter((m) => !isFavorite(m.name));

		function sortSection(section: MarketRow[]): MarketRow[] {
			if (deferredSearch) return section;
			if (sorting.length === 0) return section;

			const { id, desc } = sorting[0];
			return [...section].sort((a, b) => {
				const cmp = Big(getSortValue(a, id)).cmp(Big(getSortValue(b, id)));
				return desc ? -cmp : cmp;
			});
		}

		return [...sortSection(favoriteMarkets), ...sortSection(nonFavoriteMarkets)];
	}, [filteredMarkets, isFavorite, sorting, deferredSearch]);

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

	useEffect(() => {
		if (!open) return;

		function handleWindowBlur() {
			setOpen(false);
		}

		window.addEventListener("blur", handleWindowBlur);
		return () => window.removeEventListener("blur", handleWindowBlur);
	}, [open]);

	useEffect(() => {
		if (!open) {
			hasInitializedRef.current = false;
			setHighlightedIndex(-1);
			return;
		}

		if (rows.length === 0) return;

		if (!hasInitializedRef.current) {
			hasInitializedRef.current = true;
			const index = value ? rows.findIndex((row) => row.original.name === value) : -1;
			setHighlightedIndex(index >= 0 ? index : 0);
			if (index > 0) {
				virtualizer.scrollToIndex(index, { align: "center" });
			}
		}
	}, [open, rows, value, virtualizer]);

	useEffect(() => {
		if (open && hasInitializedRef.current) {
			setHighlightedIndex(0);
		}
	}, [deferredSearch, scope, subcategory]);

	function handleKeyDown(e: React.KeyboardEvent) {
		if (rows.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) => {
					const next = Math.min(prev + 1, rows.length - 1);
					virtualizer.scrollToIndex(next, { align: "auto" });
					return next;
				});
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) => {
					const next = Math.max(prev - 1, 0);
					virtualizer.scrollToIndex(next, { align: "auto" });
					return next;
				});
				break;
			case "Enter":
				e.preventDefault();
				if (rows[highlightedIndex]) {
					handleSelect(rows[highlightedIndex].original.name);
				}
				break;
			case "Escape":
				setOpen(false);
				break;
		}
	}

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
		setSearch: handleSearchChange,
		isLoading: open && (isLoading || isPending),
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
		highlightedIndex,
		handleKeyDown,
	};
}
