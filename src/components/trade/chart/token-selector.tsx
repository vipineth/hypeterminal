import { t } from "@lingui/core/macro";
import {
	ArrowDownIcon,
	ArrowsDownUpIcon,
	ArrowUpIcon,
	CaretDownIcon,
	FireIcon,
	MagnifyingGlassIcon,
	StarIcon,
} from "@phosphor-icons/react";
import { flexRender } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { get24hChange, getOiUsd, isTokenInCategory } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatUSD } from "@/lib/format";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";
import type { MarketRow, MarketScope } from "./constants";
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

export function TokenSelector({ selectedMarket, onValueChange }: TokenSelectorProps) {
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
	} = useTokenSelector({ value: selectedMarket?.name, onValueChange });

	const virtualItems = virtualizer.getVirtualItems();
	const headerGroup = table.getHeaderGroups()[0];
	const showScopeTabs = exchangeScope === "all";
	const showSubcategoryTabs = !exchangeDex && subcategories.length > 0;
	const showSelectorFilters = showScopeTabs || showSubcategoryTabs;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="text"
					size="none"
					role="combobox"
					aria-expanded={open}
					aria-label={t`Select token`}
					className="gap-2 px-2 py-1.5 bg-surface-execution border border-border-200/40 rounded-sm text-2xs font-bold uppercase tracking-wider hover:bg-surface-execution"
				>
					{selectedMarket && <AssetDisplay coin={selectedMarket.name} variant="full" iconClassName="size-4 shrink-0" />}
					<CaretDownIcon className="size-4 text-text-600" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[calc(100vw-1rem)] sm:w-2xl max-w-2xl p-0 border-border-200/60 bg-surface-execution"
				align="start"
				sideOffset={8}
				onKeyDown={handleKeyDown}
			>
				<div className="flex flex-col">
					<div className="border-b border-border-200/40">
						<div className="relative p-2">
							<MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-600" />
							<Input
								placeholder={t`Search markets...`}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-7 py-4 text-xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/40"
							/>
						</div>
					</div>

					{showSelectorFilters ? (
						<div className="py-2 border-b border-border-200/40 bg-surface-base/50">
							{showScopeTabs ? (
								<div className="flex items-center gap-0.5 flex-wrap">
									{marketScopes.map((s) => {
										const isSelected = scope === s.value;
										return (
											<Button
												key={s.value}
												variant="text"
												size="none"
												onClick={() => handleScopeSelect(s.value)}
												className={cn(
													"px-2 py-1 text-3xs uppercase tracking-wider cursor-pointer",
													isSelected
														? "bg-warning-700/10 text-warning-700 hover:bg-warning-700/10 hover:text-warning-700"
														: "text-text-950 hover:bg-transparent",
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
												variant="text"
												size="none"
												onClick={() => handleSubcategorySelect(sub.value)}
												className={cn(
													"px-2 py-0.5 text-4xs tracking-wider cursor-pointer",
													isSelected
														? "bg-primary-default/10 text-primary-default hover:bg-primary-default/10 hover:text-primary-default"
														: "text-text-950 hover:bg-transparent hover:text-text-950",
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
					<div className="flex items-center px-3 py-1.5 text-4xs uppercase tracking-wider text-text-950 border-b border-border-200/40 bg-surface-base/30">
						<div className="flex-1 min-w-0">{t`Market`}</div>
						{headerGroup?.headers
							.filter((h) => h.id !== "pairName")
							.map((header) => {
								const sortState = header.column.getIsSorted();
								const hiddenOnMobile = ["oi", "volume", "funding"].includes(header.id);
								const hideForSpot = scope === "spot" && ["oi", "funding"].includes(header.id);

								if (hideForSpot) return null;

								return (
									<Button
										key={header.id}
										variant="text"
										size="none"
										onClick={header.column.getToggleSortingHandler()}
										className={cn(
											"w-16 sm:w-20 justify-end gap-1 hover:text-text-950 hover:bg-transparent",
											hiddenOnMobile && "hidden sm:flex",
										)}
										aria-label={t`Sort by ${String(header.column.columnDef.header ?? "")}`}
									>
										<span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
										<span className="shrink-0">
											{sortState === "asc" ? (
												<ArrowUpIcon className="size-2.5" />
											) : sortState === "desc" ? (
												<ArrowDownIcon className="size-2.5" />
											) : (
												<ArrowsDownUpIcon className="size-2.5 opacity-40" />
											)}
										</span>
									</Button>
								);
							})}
					</div>

					<div ref={containerRef} className="h-72 overflow-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<span className="text-3xs text-text-950">{t`Loading markets...`}</span>
							</div>
						) : rows.length === 0 ? (
							<div className="py-8 text-center text-3xs text-text-950">{t`No markets found.`}</div>
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
										"text-2xs font-medium tabular-nums",
										changePercent === null ? "text-text-600" : getValueColorClass(changePercent),
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
												"flex items-center px-3 py-1.5 cursor-pointer border-b border-border-200/20",
												"hover:bg-primary-default/10 transition-colors",
												"absolute top-0 left-0 w-full",
												isSelected && !isHighlighted && "bg-surface-analysis",
												isHighlighted && "bg-primary-default/15",
											)}
											style={{
												height: `${virtualItem.size}px`,
												transform: `translateY(${virtualItem.start}px)`,
											}}
										>
											<div className="flex-1 min-w-0 flex items-center gap-2">
												<AssetDisplay coin={market.name} hideName iconClassName="size-5 shrink-0" />
												<div className="min-w-0">
													<div className="flex items-center gap-1">
														<span className="font-semibold text-2xs">{market.pairName}</span>
														<Button
															variant="text"
															size="none"
															onClick={(e) => {
																e.stopPropagation();
																toggleFavorite(market.name);
															}}
															className="hover:scale-110 hover:bg-transparent"
															aria-label={isFav ? t`Remove from favorites` : t`Add to favorites`}
														>
															<StarIcon
																className={cn(
																	"size-2.5 transition-colors",
																	isFav ? "fill-warning-700 text-warning-700" : "text-text-600 hover:text-warning-700",
																)}
															/>
														</Button>
														{isTokenInCategory(market.shortName, "new") && (
															<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
																{t`NEW`}
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-1.5 text-4xs text-text-950">
														{getMaxLeverage(market) && <span>{getMaxLeverage(market)}x</span>}
														{isSpot && <span className="text-primary-default">Spot</span>}
														{isHip3 && <span className="text-warning-700">{getDex(market)}</span>}
													</div>
												</div>
											</div>
											<div className="w-16 sm:w-20 text-right">
												<span className="text-2xs font-medium tabular-nums">
													{formatPrice(market.markPx, {
														szDecimals: getSzDecimals(market),
													})}
												</span>
											</div>
											<div className="w-16 sm:w-20 text-right">
												<span className={changeClass}>{changeText}</span>
											</div>
											{scope !== "spot" && (
												<div className="w-16 sm:w-20 text-right hidden sm:block">
													<span className="text-2xs font-medium tabular-nums">{formatUSD(oiValue)}</span>
												</div>
											)}
											<div className="w-16 sm:w-20 text-right hidden sm:block">
												<span className="text-2xs font-medium tabular-nums">{formatUSD(market.dayNtlVlm)}</span>
											</div>
											{scope !== "spot" && (
												<div className="w-16 sm:w-20 text-right hidden sm:block">
													<div className="flex items-center justify-end gap-1">
														{market.funding && (
															<FireIcon className={cn("size-2.5", getValueColorClass(market.funding))} />
														)}
														<span
															className={cn(
																"text-2xs tabular-nums font-medium",
																market.funding ? getValueColorClass(market.funding) : "text-text-600",
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

					<div className="px-3 py-1.5 bg-surface-base/30 flex items-center justify-between text-4xs text-text-950">
						<span>
							{filteredMarkets.length} {t`markets`}
						</span>
						<span className="tabular-nums">{sorting.length > 0 ? t`Sorted by ${sorting[0].id}` : t`Updated live`}</span>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
