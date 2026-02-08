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
import { isTokenInCategory } from "@/domain/market";
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
	} = useTokenSelector({ value: selectedMarket?.name ?? "", onValueChange });

	const virtualItems = virtualizer.getVirtualItems();
	const headerGroup = table.getHeaderGroups()[0];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="text"
					size="none"
					role="combobox"
					aria-expanded={open}
					aria-label={t`Select token`}
					className="gap-2 px-2 h-7 min-w-36 bg-surface-800 border border-border/40 rounded-sm text-2xs font-bold uppercase tracking-wider hover:bg-surface-800"
				>
					{selectedMarket && <AssetDisplay asset={selectedMarket} iconClassName="size-6 shrink-0" />}
					<CaretDownIcon className="size-4 text-fg-700" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[calc(100vw-1rem)] sm:w-2xl max-w-2xl p-0 border-border/60 bg-surface-800"
				align="start"
				sideOffset={8}
				onKeyDown={handleKeyDown}
			>
				<div className="flex flex-col p-2">
					<div className="border-b border-border/40">
						<div className="relative">
							<MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-fg-700" />
							<Input
								placeholder={t`Search markets...`}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-7 h-7 text-xs bg-surface-200/50 border-border/60 focus:border-status-info/40"
							/>
						</div>
					</div>

					<div className="py-2 border-b border-border/40 bg-surface-200/50">
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
												? "bg-status-warning/10 text-status-warning hover:bg-status-warning/10 hover:text-status-warning"
												: "text-fg-700 hover:bg-transparent",
										)}
									>
										{s.label}
									</Button>
								);
							})}
						</div>
						{subcategories.length > 0 && (
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
													? "bg-status-info/10 text-status-info hover:bg-status-info/10 hover:text-status-info"
													: "text-fg-700/80 hover:bg-transparent hover:text-fg-700",
											)}
											aria-label={t`Filter by ${sub.label}`}
											aria-pressed={isSelected}
										>
											{sub.label}
										</Button>
									);
								})}
							</div>
						)}
					</div>
					<div className="flex items-center px-3 py-1.5 text-4xs uppercase tracking-wider text-fg-700/70 border-b border-border/40 bg-surface-200/30">
						<div className="flex-1 min-w-0">{t`Market`}</div>
						{headerGroup?.headers
							.filter((h) => h.id !== "displayName")
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
											"w-16 sm:w-20 justify-end gap-1 hover:text-fg-900 hover:bg-transparent",
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
								<span className="text-3xs text-fg-700">{t`Loading markets...`}</span>
							</div>
						) : rows.length === 0 ? (
							<div className="py-8 text-center text-3xs text-fg-700">{t`No markets found.`}</div>
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

									const { markPx, prevDayPx } = market;
									const changeDecimal =
										markPx && prevDayPx && prevDayPx !== 0 ? (markPx - prevDayPx) / prevDayPx : null;

									const changeClass = cn(
										"text-2xs font-medium tabular-nums",
										changeDecimal === null ? "text-fg-700" : getValueColorClass(changeDecimal),
									);
									const changeText = formatPercent(changeDecimal);

									const isSpot = market.kind === "spot";
									const isHip3 = market.kind === "builderPerp";

									const oiValue = market.openInterest && market.markPx ? market.openInterest * market.markPx : null;

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
												"flex items-center px-3 py-1.5 cursor-pointer border-b border-border/20",
												"hover:bg-action-primary/10 transition-colors",
												"absolute top-0 left-0 w-full",
												isSelected && !isHighlighted && "bg-surface-300",
												isHighlighted && "bg-action-primary/15",
											)}
											style={{
												height: `${virtualItem.size}px`,
												transform: `translateY(${virtualItem.start}px)`,
											}}
										>
											<div className="flex-1 min-w-0 flex items-center gap-2">
												<AssetDisplay asset={market} hideName iconClassName="size-5 shrink-0" />
												<div className="min-w-0">
													<div className="flex items-center gap-1">
														<span className="font-semibold text-2xs">{market.displayName}</span>
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
																	isFav
																		? "fill-status-warning text-status-warning"
																		: "text-fg-700 hover:text-status-warning",
																)}
															/>
														</Button>
														{isTokenInCategory(market.displayName, "new") && (
															<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
																{t`NEW`}
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-1.5 text-4xs text-fg-700">
														{getMaxLeverage(market) && <span>{getMaxLeverage(market)}x</span>}
														{isSpot && <span className="text-status-info">Spot</span>}
														{isHip3 && <span className="text-status-warning">{getDex(market)}</span>}
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
														{market.funding !== null && (
															<FireIcon className={cn("size-2.5", getValueColorClass(market.funding))} />
														)}
														<span
															className={cn(
																"text-2xs tabular-nums font-medium",
																market.funding === null ? "text-fg-700" : getValueColorClass(market.funding),
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

					<div className="px-3 py-1.5 bg-surface-200/30 flex items-center justify-between text-4xs text-fg-700">
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
