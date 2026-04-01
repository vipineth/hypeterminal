import { Badge, Button, Drawer, DrawerContent, DrawerTrigger, SearchInput } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowDownIcon, ArrowsDownUpIcon, ArrowUpIcon, CaretDownIcon, FireIcon, StarIcon } from "@phosphor-icons/react";
import { flexRender } from "@tanstack/react-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { get24hChange, getOiUsd, isTokenInCategory } from "@/domain/market";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatUSD } from "@/lib/format";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";
import type { MarketRow, MarketScope } from "./token-selector-columns";
import { useTokenSelector } from "./use-token-selector";

export type TokenSelectorProps = {
	selectedMarket: UnifiedMarketInfo | undefined;
	onValueChange: (value: string) => void;
};

const marketScopes: { value: MarketScope; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "perp", label: "Perp" },
	{ value: "spot", label: "Spot" },
	{ value: "hip3", label: "HIP-3" },
];

function getSzDecimals(market: MarketRow): number {
	if (market.kind === "spot") return market.tokensInfo[0]?.szDecimals ?? 4;
	return market.szDecimals;
}

function getMaxLeverage(market: MarketRow): number | null {
	if (market.kind === "spot") return null;
	return market.maxLeverage ?? null;
}

function getDex(market: MarketRow): string | undefined {
	if (market.kind === "builderPerp") return market.dex;
	return undefined;
}

function SortIcon({ columnId, sorting }: { columnId: string; sorting: { id: string; desc: boolean }[] }) {
	const sort = sorting.find((s) => s.id === columnId);
	if (sort?.desc === false) return <ArrowUpIcon className="size-3" />;
	if (sort?.desc === true) return <ArrowDownIcon className="size-3" />;
	return <ArrowsDownUpIcon className="size-3 opacity-50" />;
}

interface TokenSelectorContentProps {
	selectedMarket: UnifiedMarketInfo | undefined;
	scope: MarketScope;
	exchangeScope: string;
	exchangeDex: string | undefined;
	subcategory: string;
	subcategories: { value: string; label: string }[];
	search: string;
	setSearch: (value: string) => void;
	isLoading: boolean;
	isFavorite: (name: string) => boolean;
	sorting: { id: string; desc: boolean }[];
	handleSort: (columnId: string) => void;
	handleSelect: (name: string) => void;
	handleSubcategorySelect: (value: string) => void;
	handleScopeSelect: (value: MarketScope) => void;
	toggleFavorite: (name: string) => void;
	table: ReturnType<typeof useTokenSelector>["table"];
	rows: ReturnType<typeof useTokenSelector>["rows"];
	virtualizer: ReturnType<typeof useTokenSelector>["virtualizer"];
	containerRef: React.RefObject<HTMLDivElement | null>;
	filteredMarkets: ReturnType<typeof useTokenSelector>["filteredMarkets"];
	highlightedIndex: number;
	mobile?: boolean;
}

function TokenSelectorContent({
	selectedMarket,
	scope,
	exchangeScope,
	exchangeDex,
	subcategory,
	subcategories,
	search,
	setSearch,
	isLoading,
	isFavorite,
	sorting,
	handleSort,
	handleSelect,
	handleSubcategorySelect,
	handleScopeSelect,
	toggleFavorite,
	table,
	rows,
	virtualizer,
	containerRef,
	filteredMarkets,
	highlightedIndex,
	mobile,
}: TokenSelectorContentProps) {
	const virtualItems = virtualizer.getVirtualItems();
	const headerGroup = table.getHeaderGroups()[0];
	const showScopeTabs = exchangeScope === "all";
	const showSubcategoryTabs = !exchangeDex && subcategories.length > 0;
	const showSelectorFilters = showScopeTabs || showSubcategoryTabs;

	return (
		<div className="flex flex-col">
			<div className="border-b border-stroke-weak/40">
				<div className="p-2">
					<SearchInput
						placeholder={t`Search markets...`}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onClear={() => setSearch("")}
						size={mobile ? "md" : "sm"}
					/>
				</div>
			</div>

			{showSelectorFilters ? (
				<div className="p-2 border-b border-stroke-weak/40 bg-bg-sunken/50">
					{showScopeTabs ? (
						<div className="flex items-center gap-0.5 flex-wrap">
							{marketScopes.map((s) => {
								const isSelected = scope === s.value;
								return (
									<Button
										key={s.value}
										variant="link"
										intent="neutral"
										onClick={() => handleScopeSelect(s.value)}
										className={cn(
											"px-2 py-1 uppercase tracking-wider cursor-pointer no-underline text-xs",
											isSelected
												? "bg-text-warning/10 text-text-warning hover:bg-text-warning/10 hover:text-text-warning"
												: "text-text-strong hover:bg-transparent",
										)}
									>
										{s.label}
									</Button>
								);
							})}
						</div>
					) : null}
					{showSubcategoryTabs ? (
						<div className="flex items-center gap-0.5 flex-wrap mt-1.5 pt-1.5 pl-2 ml-1">
							{subcategories.map((sub) => {
								const isSelected = subcategory === sub.value;
								return (
									<Button
										key={sub.value}
										variant="link"
										intent="neutral"
										onClick={() => handleSubcategorySelect(sub.value)}
										className={cn(
											"px-2 py-0.5 tracking-wider cursor-pointer no-underline text-xs",
											isSelected
												? "bg-text-brand/10 text-text-brand hover:bg-text-brand/10 hover:text-text-brand"
												: "text-text-strong hover:bg-transparent hover:text-text-strong",
										)}
										aria-label={t`Filter by ${sub.label}`}
										aria-pressed={isSelected}
									>
										{sub.label}
									</Button>
								);
							})}
						</div>
					) : null}
				</div>
			) : null}
			<div
				className={cn(
					"flex items-center px-3 py-1.5 uppercase tracking-wider text-text-strong border-b border-stroke-weak/40 bg-bg-sunken/30",
					mobile ? "text-xs" : "text-xs",
				)}
			>
				<div className="flex-1 min-w-0">{t`Market`}</div>
				{headerGroup?.headers
					.filter((h) => h.id !== "pairName")
					.map((header) => {
						const hiddenOnMobile = ["oi", "volume", "funding"].includes(header.id);
						const hideForSpot = scope === "spot" && ["oi", "funding"].includes(header.id);

						if (hideForSpot) return null;

						return (
							<Button
								key={header.id}
								variant="link"
								intent="neutral"
								onClick={() => handleSort(header.id)}
								className={cn(
									"justify-end gap-1 hover:text-text-strong hover:bg-transparent no-underline text-xs",
									mobile ? "w-20" : "w-16 sm:w-20",
									hiddenOnMobile && (mobile ? "hidden" : "hidden sm:flex"),
								)}
								aria-label={t`Sort by ${String(header.column.columnDef.header ?? "")}`}
							>
								<span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
								<SortIcon columnId={header.id} sorting={sorting} />
							</Button>
						);
					})}
			</div>

			<div ref={containerRef} className={cn("overflow-auto", mobile ? "h-[60vh]" : "h-72")}>
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<span className={cn("text-text-strong", mobile ? "text-xs" : "text-xs")}>{t`Loading markets...`}</span>
					</div>
				) : rows.length === 0 ? (
					<div
						className={cn("py-8 text-center text-text-strong", mobile ? "text-xs" : "text-xs")}
					>{t`No markets found.`}</div>
				) : (
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{virtualItems.map((virtualItem) => {
							const row = rows[virtualItem.index];
							const market = row.original;
							const isSelected = selectedMarket?.name === market.name;
							const isHighlighted = highlightedIndex >= 0 && virtualItem.index === highlightedIndex;
							const isFav = isFavorite(market.name);

							const changePercent = get24hChange(market.prevDayPx, market.markPx);

							const changeClass = cn(
								"font-medium tabular-nums",
								mobile ? "text-xs" : "text-xs",
								changePercent === null ? "text-text-weak" : getValueColorClass(changePercent),
							);
							const changeText = formatPercent(changePercent !== null ? changePercent / 100 : null);

							const isSpot = market.kind === "spot";
							const isHip3 = market.kind === "builderPerp";

							const oiValue = getOiUsd(market.openInterest, market.markPx);

							return (
								<div
									key={row.id}
									data-index={virtualItem.index}
									onClick={() => handleSelect(market.name)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											handleSelect(market.name);
										}
									}}
									role="option"
									aria-selected={isSelected}
									tabIndex={0}
									className={cn(
										"flex items-center px-3 cursor-pointer border-b border-stroke-weak/20",
										"hover:bg-fill-hover transition-colors",
										"absolute top-0 left-0 w-full",
										mobile ? "py-2.5" : "py-1.5",
										isSelected && !isHighlighted && "bg-bg-raised",
										isHighlighted && "bg-fill-hover",
									)}
									style={{
										height: `${virtualItem.size}px`,
										transform: `translateY(${virtualItem.start}px)`,
									}}
								>
									<div className="flex-1 min-w-0 flex items-center gap-2">
										<AssetDisplay
											coin={market.name}
											hideName
											iconClassName={cn("shrink-0", mobile ? "size-6" : "size-5")}
										/>
										<div className="min-w-0">
											<div className="flex items-center gap-1">
												<span className={cn("font-semibold", mobile ? "text-xs" : "text-xs")}>{market.pairName}</span>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														toggleFavorite(market.name);
													}}
													className="hover:scale-110 cursor-pointer"
													aria-label={isFav ? t`Remove from favorites` : t`Add to favorites`}
												>
													<StarIcon
														className={cn(
															"transition-colors",
															mobile ? "size-3" : "size-2.5",
															isFav ? "fill-text-warning text-text-warning" : "text-text-weak hover:text-text-warning",
														)}
													/>
												</button>
												{isTokenInCategory(market.shortName, "new") && (
													<Badge tone="neutral" size="sm" className="px-1 py-0 text-xs">
														{t`NEW`}
													</Badge>
												)}
											</div>
											<div className={cn("flex items-center gap-1.5 text-text-strong", mobile ? "text-xs" : "text-xs")}>
												{getMaxLeverage(market) && <span>{getMaxLeverage(market)}x</span>}
												{isSpot && <span className="text-text-brand">Spot</span>}
												{isHip3 && <span className="text-text-warning">{getDex(market)}</span>}
											</div>
										</div>
									</div>
									<div className={cn("text-right", mobile ? "w-20" : "w-16 sm:w-20")}>
										<span className={cn("font-medium tabular-nums", mobile ? "text-xs" : "text-xs")}>
											{formatPrice(market.markPx, {
												szDecimals: getSzDecimals(market),
											})}
										</span>
									</div>
									<div className={cn("text-right", mobile ? "w-20" : "w-16 sm:w-20")}>
										<span className={changeClass}>{changeText}</span>
									</div>
									{scope !== "spot" && (
										<div className="w-16 sm:w-20 text-right hidden sm:block">
											<span className="text-xs font-medium tabular-nums">{formatUSD(oiValue)}</span>
										</div>
									)}
									<div className="w-16 sm:w-20 text-right hidden sm:block">
										<span className="text-xs font-medium tabular-nums">{formatUSD(market.dayNtlVlm)}</span>
									</div>
									{scope !== "spot" && (
										<div className="w-16 sm:w-20 text-right hidden sm:block">
											<div className="flex items-center justify-end gap-1">
												{market.funding && <FireIcon className={cn("size-2.5", getValueColorClass(market.funding))} />}
												<span
													className={cn(
														"text-xs tabular-nums font-medium",
														market.funding ? getValueColorClass(market.funding) : "text-text-weak",
													)}
												>
													{formatPercent(market.funding, {
														minimumFractionDigits: 4,
														signDisplay: "exceptZero",
													})}
												</span>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div
				className={cn(
					"px-3 py-1.5 bg-bg-sunken/30 flex items-center justify-between text-text-strong",
					mobile ? "text-xs" : "text-xs",
				)}
			>
				<span>
					{filteredMarkets.length} {t`markets`}
				</span>
				<span className="tabular-nums">{sorting.length > 0 ? t`Sorted by ${sorting[0].id}` : t`Updated live`}</span>
			</div>
		</div>
	);
}

export function TokenSelector({ selectedMarket, onValueChange }: TokenSelectorProps) {
	const isMobile = useIsMobile();
	const {
		open,
		setOpen,
		scope,
		exchangeScope,
		exchangeDex,
		subcategory,
		subcategories,
		search,
		setSearch,
		isLoading,
		isFavorite,
		sorting,
		handleSort,
		handleSelect,
		handleSubcategorySelect,
		handleScopeSelect,
		toggleFavorite,
		table,
		rows,
		virtualizer,
		containerRef,
		filteredMarkets,
		highlightedIndex,
		handleKeyDown,
	} = useTokenSelector({ value: selectedMarket?.name ?? "", onValueChange });

	const contentProps = {
		selectedMarket,
		scope,
		exchangeScope,
		exchangeDex,
		subcategory,
		subcategories,
		search,
		setSearch,
		isLoading,
		isFavorite,
		sorting,
		handleSort,
		handleSelect,
		handleSubcategorySelect,
		handleScopeSelect,
		toggleFavorite,
		table,
		rows,
		virtualizer,
		containerRef,
		filteredMarkets,
		highlightedIndex,
	};

	const trigger = (
		<button
			type="button"
			role="combobox"
			aria-expanded={open}
			aria-label={t`Select token`}
			className="inline-flex items-center gap-2 px-2 py-1.5 bg-bg-overlay border border-stroke-weak/40 rounded-8 text-xs font-bold uppercase tracking-wider hover:bg-bg-overlay cursor-pointer"
		>
			{selectedMarket && (
				<AssetDisplay
					coin={selectedMarket.name}
					variant="full"
					iconClassName="size-4 shrink-0"
					nameClassName="inline-flex min-w-[13ch]"
				/>
			)}
			<CaretDownIcon className="size-4 text-text-weak" />
		</button>
	);

	if (isMobile) {
		return (
			<Drawer side="bottom" open={open} onOpenChange={setOpen}>
				<DrawerTrigger>{trigger}</DrawerTrigger>
				<DrawerContent className="max-h-[90vh] overflow-hidden">
					<TokenSelectorContent {...contentProps} mobile />
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				className="w-[calc(100vw-1rem)] sm:w-2xl max-w-2xl p-0 border-stroke-weak/60 bg-bg-overlay"
				align="start"
				sideOffset={8}
				onKeyDown={handleKeyDown}
			>
				<TokenSelectorContent {...contentProps} />
			</PopoverContent>
		</Popover>
	);
}
