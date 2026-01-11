import { t } from "@lingui/core/macro";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Flame, Search, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { getTokenIconUrl, isTokenInCategory, marketCategories } from "@/config/token";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatUSD } from "@/lib/format";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import { QUOTE_ASSET } from "./constants";
import { useTokenSelector } from "./use-token-selector";

export type TokenSelectorProps = {
	value: string;
	onValueChange: (value: string) => void;
};

export function TokenSelector({ value, onValueChange }: TokenSelectorProps) {
	const {
		open,
		setOpen,
		category,
		search,
		setSearch,
		isLoading,
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
	} = useTokenSelector({ value, onValueChange });

	const virtualItems = virtualizer.getVirtualItems();
	const headerGroup = table.getHeaderGroups()[0];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					role="combobox"
					aria-expanded={open}
					aria-label={t`Select token`}
					className="h-6 gap-1.5 text-xs font-semibold px-2"
				>
					<Avatar className="size-5 shrink-0">
						<AvatarImage src={getTokenIconUrl(value)} alt={value} />
						<AvatarFallback className="text-3xs bg-terminal-amber/20 text-terminal-amber">
							{value.slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<span className="text-terminal-amber truncate">{value}</span>
					<span className="text-muted-foreground hidden sm:inline">/{QUOTE_ASSET}</span>
					<ChevronDown className="size-3 text-muted-foreground shrink-0" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[calc(100vw-1rem)] sm:w-xl max-w-xl p-0 border-border/60 bg-surface"
				align="start"
				sideOffset={8}
			>
				<div className="flex flex-col p-2">
					<div className="border-b border-border/40">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
							<Input
								placeholder={t`Search markets...`}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-7 h-7 text-xs bg-background/50 border-border/60 focus:border-terminal-cyan/40"
							/>
						</div>
					</div>

					<div className="py-2 border-b border-border/40 bg-surface/50">
						<div className="flex items-center gap-0.5 flex-wrap">
							{marketCategories.map((cat) => {
								const isSelected = category === cat.value;
								return (
									<Button
										key={cat.value}
										variant="ghost"
										size="none"
										onClick={() => handleCategorySelect(cat.value)}
										className={cn(
											"px-2 py-1 text-3xs uppercase tracking-wider gap-1 cursor-pointer",
											isSelected
												? "bg-terminal-cyan/10 text-terminal-cyan hover:bg-terminal-cyan/10 hover:text-terminal-cyan"
												: "text-muted-foreground hover:bg-transparent",
										)}
										aria-label={t`Filter by ${cat.label}`}
										aria-pressed={isSelected}
									>
										{cat.icon}
										{cat.label}
									</Button>
								);
							})}
						</div>
					</div>
					<div className="flex items-center py-1.5 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 bg-surface/30">
						{headerGroup?.headers.map((header) => {
							if (header.id === "coin") {
								return (
									<div key={header.id} className="flex-1 min-w-0">
										{flexRender(header.column.columnDef.header, header.getContext())}
									</div>
								);
							}

							const sortState = header.column.getIsSorted();

							const hiddenOnMobile = ["openInterest", "dayNtlVlm", "funding"].includes(header.id);

							return (
								<Button
									key={header.id}
									variant="ghost"
									size="none"
									onClick={header.column.getToggleSortingHandler()}
									className={cn(
										"w-16 sm:w-20 justify-end gap-1 hover:text-foreground hover:bg-transparent",
										hiddenOnMobile && "hidden sm:flex",
									)}
									aria-label={t`Sort by ${String(header.column.columnDef.header ?? "")}`}
								>
									<span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
									<span className="shrink-0">
										{sortState === "asc" ? (
											<ArrowUp className="size-2.5" />
										) : sortState === "desc" ? (
											<ArrowDown className="size-2.5" />
										) : (
											<ArrowUpDown className="size-2.5 opacity-40" />
										)}
									</span>
								</Button>
							);
						})}
					</div>

					<div ref={containerRef} className="h-72 overflow-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<span className="text-3xs text-muted-foreground">{t`Loading markets...`}</span>
							</div>
						) : rows.length === 0 ? (
							<div className="py-8 text-center text-3xs text-muted-foreground">{t`No markets found.`}</div>
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
									const fundingNum = market.ctxNumbers?.funding ?? 0;
									const isFundingPositive = fundingNum >= 0;
									const isSelected = value === market.coin;
									const isFav = isFavorite(market.coin);
									const changePct = calculate24hPriceChange(market.ctxNumbers);
									const changeIsPositive = (changePct ?? 0) >= 0;
									const changeClass = cn(
										"text-2xs font-medium tabular-nums",
										changePct === null
											? "text-muted-foreground"
											: changeIsPositive
												? "text-terminal-green"
												: "text-terminal-red",
									);
									const changeText = changePct === null ? FALLBACK_VALUE_PLACEHOLDER : formatPercent(changePct / 100);

									return (
										<div
											key={row.id}
											data-index={virtualItem.index}
											onClick={() => handleSelect(market.coin)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													handleSelect(market.coin);
												}
											}}
											role="option"
											aria-selected={isSelected}
											tabIndex={0}
											className={cn(
												"flex items-center px-3 py-1.5 cursor-pointer border-b border-border/20",
												"hover:bg-accent/30 transition-colors",
												"absolute top-0 left-0 w-full",
												isSelected && "bg-terminal-cyan/5",
											)}
											style={{
												height: `${virtualItem.size}px`,
												transform: `translateY(${virtualItem.start}px)`,
											}}
										>
											<div className="flex-1 min-w-0 flex items-center gap-2">
												<Avatar className="size-5 shrink-0">
													<AvatarImage src={getTokenIconUrl(market.coin)} alt={market.coin} />
													<AvatarFallback className="text-4xs bg-muted">{market.coin.slice(0, 2)}</AvatarFallback>
												</Avatar>
												<div className="min-w-0">
													<div className="flex items-center gap-1">
														<span className="font-semibold text-2xs">{market.coin}</span>
														<Button
															variant="ghost"
															size="none"
															onClick={(e) => {
																e.stopPropagation();
																toggleFavorite(market.coin);
															}}
															className="hover:scale-110 hover:bg-transparent"
															aria-label={isFav ? t`Remove from favorites` : t`Add to favorites`}
														>
															<Star
																className={cn(
																	"size-2.5 transition-colors",
																	isFav
																		? "fill-terminal-amber text-terminal-amber"
																		: "text-muted-foreground hover:text-terminal-amber",
																)}
															/>
														</Button>
														{isTokenInCategory(market.coin, "new") && (
															<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
																{t`NEW`}
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-1.5 text-4xs text-muted-foreground">
														<span>{market.maxLeverage}x</span>
													</div>
												</div>
											</div>
											<div className="w-16 sm:w-20 text-right">
												<span className="text-2xs font-medium tabular-nums">
													{formatPrice(market.ctxNumbers?.markPx ?? null, { szDecimals: market.szDecimals })}
												</span>
											</div>
											<div className="w-16 sm:w-20 text-right">
												<span className={changeClass}>{changeText}</span>
											</div>
											<div className="w-20 text-right hidden sm:block">
												<span className="text-2xs font-medium tabular-nums">
													{formatUSD(calculateOpenInterestUSD(market.ctxNumbers))}
												</span>
											</div>
											<div className="w-20 text-right hidden sm:block">
												<span className="text-2xs font-medium tabular-nums">
													{formatUSD(market.ctxNumbers?.dayNtlVlm ?? null)}
												</span>
											</div>
											<div className="w-20 text-right hidden sm:block">
												<div className="flex items-center justify-end gap-1">
													<Flame
														className={cn("size-2.5", isFundingPositive ? "text-terminal-green" : "text-terminal-red")}
													/>
													<span
														className={cn(
															"text-2xs tabular-nums font-medium",
															isFundingPositive ? "text-terminal-green" : "text-terminal-red",
														)}
													>
														{formatPercent(fundingNum, {
															minimumFractionDigits: 4,
															signDisplay: "exceptZero",
														})}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div className="px-3 py-1.5 bg-surface/30 flex items-center justify-between text-4xs text-muted-foreground">
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
