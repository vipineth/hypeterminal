import { ChevronDown, Flame, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	getTokenIconUrl,
	isFavoriteToken,
	isTokenInCategory,
	type MarketCategory,
	marketCategories,
} from "@/config/token";
import { useMarkets } from "@/hooks/hyperliquid";
import { formatPercent, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TokenSelectorProps = {
	value: string;
	onValueChange: (value: string) => void;
};

export function TokenSelector({ value, onValueChange }: TokenSelectorProps) {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<MarketCategory>("all");
	const [search, setSearch] = useState("");
	const { data: markets, isLoading } = useMarkets();

	const filteredMarkets = useMemo(() => {
		if (!markets) return [];

		return markets.filter((market) => {
			if (search && !market.coin.toLowerCase().includes(search.toLowerCase())) {
				return false;
			}
			return isTokenInCategory(market.coin, category);
		});
	}, [markets, category, search]);

	function handleSelect(coin: string) {
		onValueChange(coin);
		setOpen(false);
		setSearch("");
	}

	function handleCategorySelect(cat: MarketCategory) {
		setCategory(cat);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					role="combobox"
					aria-expanded={open}
					aria-label="Select token"
					className="h-6 gap-1.5 text-xs font-semibold px-2"
				>
					<Avatar className="size-4">
						<AvatarImage src={getTokenIconUrl(value)} alt={value} />
						<AvatarFallback className="text-3xs bg-terminal-amber/20 text-terminal-amber">
							{value.slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<span className="text-terminal-amber">{value}</span>
					<span className="text-muted-foreground">/USDC</span>
					<ChevronDown className="size-3 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-xl p-0 border-border/60 bg-surface" align="start" sideOffset={8}>
				<div className="flex flex-col">
					<div className="px-2 py-2 border-b border-border/40">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
							<Input
								placeholder="Search markets..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-7 h-7 text-xs bg-background/50 border-border/60 focus:border-terminal-cyan/60"
							/>
						</div>
					</div>

					<div className="px-2 py-1.5 border-b border-border/40 bg-surface/50">
						<div className="flex items-center gap-0.5 flex-wrap">
							{marketCategories.map((cat) => (
								<button
									key={cat.value}
									type="button"
									onClick={() => handleCategorySelect(cat.value)}
									className={cn(
										"px-2 py-1 text-3xs uppercase tracking-wider transition-colors inline-flex items-center gap-1",
										category === cat.value
											? "text-terminal-cyan bg-terminal-cyan/10"
											: "text-muted-foreground hover:text-foreground",
									)}
									tabIndex={0}
									aria-label={`Filter by ${cat.label}`}
									aria-pressed={category === cat.value}
								>
									{cat.icon}
									{cat.label}
								</button>
							))}
						</div>
					</div>

					<div className="flex items-center px-3 py-1.5 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 bg-surface/30">
						<div className="flex-1 min-w-0">Market</div>
						<div className="w-20 text-right">Price</div>
						<div className="w-20 text-right">OI</div>
						<div className="w-20 text-right">Volume</div>
						<div className="w-20 text-right">Funding</div>
					</div>

					<Command className="bg-transparent" filter={() => 1}>
						<CommandList>
							<ScrollArea className="h-72">
								<CommandEmpty className="py-8 text-center text-3xs text-muted-foreground">
									No markets found.
								</CommandEmpty>
								<CommandGroup className="p-0">
									{isLoading ? (
										<div className="flex items-center justify-center py-8">
											<span className="text-3xs text-muted-foreground">Loading markets...</span>
										</div>
									) : (
										filteredMarkets.map((market) => {
											const fundingNum = market.fundingRate ? Number.parseFloat(market.fundingRate) : 0;
											const isFundingPositive = fundingNum >= 0;
											const isSelected = value === market.coin;

											return (
												<CommandItem
													key={market.coin}
													value={market.coin}
													onSelect={() => handleSelect(market.coin)}
													className={cn(
														"flex items-center px-3 py-1.5 rounded-none cursor-pointer border-b border-border/20",
														"data-[selected=true]:bg-accent/30",
														isSelected && "bg-terminal-cyan/5",
													)}
												>
													<div className="flex-1 min-w-0 flex items-center gap-2">
														<Avatar className="size-5 shrink-0">
															<AvatarImage src={getTokenIconUrl(market.coin)} alt={market.coin} />
															<AvatarFallback className="text-4xs bg-muted">{market.coin.slice(0, 2)}</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<div className="flex items-center gap-1">
																<span className="font-semibold text-2xs">{market.coin}</span>
																{isFavoriteToken(market.coin) && (
																	<Star className="size-2.5 fill-terminal-amber text-terminal-amber" />
																)}
																{isTokenInCategory(market.coin, "new") && (
																	<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
																		NEW
																	</Badge>
																)}
															</div>
															<div className="flex items-center gap-1.5 text-4xs text-muted-foreground">
																<span>{market.maxLeverage}x</span>
															</div>
														</div>
													</div>
													<div className="w-20 text-right">
														<span className="text-2xs font-medium tabular-nums">
															{market.markPrice ? formatUSD(Number(market.markPrice)) : "-"}
														</span>
													</div>
													<div className="w-20 text-right">
														<span className="text-2xs font-medium tabular-nums">
															{market.openInterest ? formatUSD(Number(market.openInterest)) : "-"}
														</span>
													</div>
													<div className="w-20 text-right">
														<span className="text-2xs font-medium tabular-nums">
															{market.volume24h ? formatUSD(Number(market.volume24h)) : "-"}
														</span>
													</div>
													<div className="w-20 text-right">
														<div className="flex items-center justify-end gap-1">
															<Flame
																className={cn(
																	"size-2.5",
																	isFundingPositive ? "text-terminal-green" : "text-terminal-red",
																)}
															/>
															<span
																className={cn(
																	"text-2xs tabular-nums font-medium",
																	isFundingPositive ? "text-terminal-green" : "text-terminal-red",
																)}
															>
																{fundingNum
																	? formatPercent(fundingNum, {
																			minimumFractionDigits: 4,
																			signDisplay: "exceptZero",
																		})
																	: "-"}
															</span>
														</div>
													</div>
												</CommandItem>
											);
										})
									)}
								</CommandGroup>
							</ScrollArea>
						</CommandList>
					</Command>

					<div className="px-3 py-1.5 border-t border-border/40 bg-surface/30 flex items-center justify-between text-4xs text-muted-foreground">
						<span>{filteredMarkets.length} markets</span>
						<span className="tabular-nums">Updated live</span>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
