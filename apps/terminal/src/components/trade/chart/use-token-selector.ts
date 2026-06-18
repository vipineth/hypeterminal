import { getCoreRowModel, getSortedRowModel, type Row, type SortingState, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem, type Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { TOKEN_SELECTOR_OVERSCAN, TOKEN_SELECTOR_ROW_HEIGHT_PX } from "@/config/layout";
import { PERP_CATEGORIES } from "@/config/markets";
import { marketSearchConfig } from "@/config/search";
import { type ExchangeScope, isTokenInCategory, type MarketCategory } from "@/domain/market";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { createSearcher } from "@/lib/search";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useFavoriteMarkets, useMarketActions } from "@/stores/use-market-store";
import { type MarketRow, type MarketScope, TOKEN_SELECTOR_COLUMNS } from "./token-selector-columns";

export interface Subcategory {
	value: string;
	label: string;
}

export interface UseTokenSelectorOptions {
	value: string;
	onValueChange: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export interface UseTokenSelectorReturn {
	open: boolean;
	setOpen: (open: boolean) => void;
	scope: MarketScope;
	exchangeScope: ExchangeScope;
	exchangeDex: string | undefined;
	subcategory: string;
	subcategories: Subcategory[];
	search: string;
	setSearch: (search: string) => void;
	isLoading: boolean;
	isFavorite: (name: string) => boolean;
	sorting: SortingState;
	handleSort: (columnId: string) => void;
	handleSelect: (name: string) => void;
	handleSubcategorySelect: (sub: string) => void;
	handleScopeSelect: (scope: MarketScope) => void;
	toggleFavorite: (name: string) => void;
	table: ReturnType<typeof useReactTable<MarketRow>>;
	rows: Row<MarketRow>[];
	virtualizer: Virtualizer<HTMLDivElement, Element>;
	virtualItems: VirtualItem[];
	totalSize: number;
	containerRef: React.RefCallback<HTMLDivElement>;
	filteredMarkets: MarketRow[];
	highlightedIndex: number;
	handleKeyDown: (e: React.KeyboardEvent) => void;
}

function mapExchangeToMarketScope(es: ExchangeScope): MarketScope {
	if (es === "builders-perp") return "hip3";
	if (es === "perp" || es === "spot") return es;
	return "all";
}

type MarketsInfo = ReturnType<typeof useMarketsInfo>;

function computeSubcategories(
	scope: MarketScope,
	spotMarkets: MarketsInfo["spotMarkets"],
	builderPerpMarkets: MarketsInfo["builderPerpMarkets"],
): Subcategory[] {
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
}

export function useTokenSelector({
	value,
	onValueChange,
	open: controlledOpen,
	onOpenChange,
}: UseTokenSelectorOptions): UseTokenSelectorReturn {
	// The compiler would cache virtualizer.getVirtualItems()/table.getRowModel()
	// reads keyed on the stable instances, so the list never re-renders after the
	// virtualizer's internal notify. Memoization here is manual instead.
	"use no memo";
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const [localScope, setLocalScope] = useState<MarketScope>("all");
	const [localSubcategory, setLocalSubcategory] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [deferredSearch, setDeferredSearch] = useState("");
	const [isPending, startTransition] = useTransition();
	const [sorting, setSorting] = useState<SortingState>([{ id: "volume", desc: true }]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	// State (not a ref) so the virtualizer re-attaches when the popup's portal
	// mounts the scroll container in a later commit than this component's render.
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const hasInitializedRef = useRef(false);
	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = onOpenChange ?? setUncontrolledOpen;

	const { scope: exchangeScope, dex: exchangeDex } = useExchangeScope();
	const scope = exchangeScope !== "all" ? mapExchangeToMarketScope(exchangeScope) : localScope;
	const subcategory = exchangeDex ?? localSubcategory;

	function handleSearchChange(value: string) {
		setSearch(value);
		startTransition(() => setDeferredSearch(value));
		if (open && hasInitializedRef.current) {
			setHighlightedIndex(0);
		}
	}

	const { markets, spotMarkets, builderPerpMarkets, isLoading } = useMarketsInfo();

	const favorites = useFavoriteMarkets();
	const { toggleFavoriteMarket } = useMarketActions();

	const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
	const isFavorite = useCallback((name: string) => favoriteSet.has(name), [favoriteSet]);

	const subcategories = useMemo(
		() => computeSubcategories(scope, spotMarkets, builderPerpMarkets),
		[scope, spotMarkets, builderPerpMarkets],
	);

	function handleScopeSelect(newScope: MarketScope) {
		setLocalScope(newScope);
		setLocalSubcategory("all");
		if (open && hasInitializedRef.current) {
			setHighlightedIndex(0);
		}
	}

	// Semantic ref stability: when the popover is closed, freeze scopeFilteredMarkets to
	// the previous reference whenever the membership key (scope|subcategory|names) is unchanged,
	// so hidden rows don't re-render on every WS price tick. When open, always pass the live
	// reference through so prices update.
	const stableScopeFilteredRef = useRef<{ key: string; value: MarketRow[] }>({ key: "", value: [] });
	const filteredByScope = useMemo(
		() =>
			markets.filter((market) => {
				if (scope === "perp" && market.kind !== "perp") return false;
				if (scope === "spot" && market.kind !== "spot") return false;
				if (scope === "hip3" && market.kind !== "builderPerp") return false;

				if (subcategory === "all") return true;

				if (scope === "perp") {
					return isTokenInCategory(market.shortName, subcategory as MarketCategory);
				}

				if (scope === "spot" && market.kind === "spot") {
					const quoteToken = market.tokensInfo[1]?.name;
					return quoteToken === subcategory;
				}

				if (scope === "hip3" && market.kind === "builderPerp") {
					return market.dex === subcategory;
				}

				return true;
			}),
		[markets, scope, subcategory],
	);
	const scopeKey = `${scope}|${subcategory}|${filteredByScope.length}|${filteredByScope.map((m) => m.name).join(",")}`;
	let scopeFilteredMarkets: MarketRow[];
	if (open) {
		stableScopeFilteredRef.current = { key: scopeKey, value: filteredByScope };
		scopeFilteredMarkets = filteredByScope;
	} else if (stableScopeFilteredRef.current.key === scopeKey) {
		scopeFilteredMarkets = stableScopeFilteredRef.current.value;
	} else {
		stableScopeFilteredRef.current = { key: scopeKey, value: filteredByScope };
		scopeFilteredMarkets = filteredByScope;
	}

	const searcher = useMemo(() => createSearcher(scopeFilteredMarkets, marketSearchConfig), [scopeFilteredMarkets]);

	const filteredMarkets = useMemo(() => {
		if (!deferredSearch) {
			return scopeFilteredMarkets;
		}

		const marketByName = new Map(scopeFilteredMarkets.map((m) => [m.name, m]));
		return searcher
			.search(deferredSearch)
			.map((result) => marketByName.get(result.item.name))
			.filter((m): m is MarketRow => m != null);
	}, [deferredSearch, scopeFilteredMarkets, searcher]);

	function handleSort(columnId: string) {
		setSorting((prev) => {
			const current = prev[0];
			if (current?.id === columnId) return [{ id: columnId, desc: !current.desc }];
			return [{ id: columnId, desc: true }];
		});
	}

	const table = useReactTable({
		data: filteredMarkets,
		columns: TOKEN_SELECTOR_COLUMNS,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
		onSortingChange: setSorting,
		enableSortingRemoval: false,
	});

	const sortedRows = table.getRowModel().rows;
	// Semantic: `rows` is used as an effect dep below — keep referential stability so the
	// initialization effect doesn't re-run on every render.
	const rows = useMemo(() => {
		const favoriteNames = new Set(favorites);
		const favoriteRows = sortedRows.filter((r) => favoriteNames.has(r.original.name));
		const nonFavoriteRows = sortedRows.filter((r) => !favoriteNames.has(r.original.name));
		return [...favoriteRows, ...nonFavoriteRows];
	}, [sortedRows, favorites]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => container,
		estimateSize: () => TOKEN_SELECTOR_ROW_HEIGHT_PX,
		overscan: TOKEN_SELECTOR_OVERSCAN,
	});
	const virtualItems = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();

	useEffect(() => {
		if (open) {
			virtualizer.measure();
		}
	}, [open, virtualizer]);

	useEffect(() => {
		if (!open) return;

		function handleWindowBlur() {
			setOpen(false);
		}

		window.addEventListener("blur", handleWindowBlur);
		return () => window.removeEventListener("blur", handleWindowBlur);
	}, [open, setOpen]);

	useEffect(() => {
		if (!open) {
			hasInitializedRef.current = false;
			return;
		}

		if (rows.length === 0) return;

		if (!hasInitializedRef.current) {
			hasInitializedRef.current = true;
			const index = value ? rows.findIndex((row) => row.original.name === value) : -1;
			setHighlightedIndex(index >= 0 ? index : 0);
			if (index > 0) {
				requestAnimationFrame(() => {
					virtualizer.scrollToIndex(index, { align: "center" });
				});
			}
		}
	}, [open, rows, value, virtualizer]);

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
		setDeferredSearch("");
	}

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) {
			setSearch("");
			setDeferredSearch("");
		}
	}

	function handleSubcategorySelect(next: string) {
		setLocalSubcategory(next);
		if (open && hasInitializedRef.current) {
			setHighlightedIndex(0);
		}
	}

	return {
		open,
		setOpen: handleOpenChange,
		scope,
		exchangeScope,
		exchangeDex,
		subcategory,
		subcategories,
		search,
		setSearch: handleSearchChange,
		isLoading: open && ((isLoading && markets.length === 0) || isPending),
		isFavorite,
		sorting,
		handleSort,
		handleSelect,
		handleSubcategorySelect,
		handleScopeSelect,
		toggleFavorite: toggleFavoriteMarket,
		table,
		rows,
		virtualizer,
		virtualItems,
		totalSize,
		containerRef: setContainer,
		filteredMarkets,
		highlightedIndex,
		handleKeyDown,
	};
}
