import { Check, ChevronDown, Flame, Search, Star, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarkets } from "@/hooks/hyperliquid";
import { cn } from "@/lib/utils";

type Category = "all" | "favorites" | "trending" | "new" | "defi" | "layer1" | "layer2" | "meme";

const categories: { value: Category; label: string; icon: React.ReactNode }[] = [
	{ value: "all", label: "All", icon: null },
	{ value: "favorites", label: "Favorites", icon: <Star className="size-2.5" /> },
	{ value: "trending", label: "Hot", icon: <TrendingUp className="size-2.5" /> },
	{ value: "new", label: "New", icon: <Zap className="size-2.5" /> },
	{ value: "defi", label: "DeFi", icon: null },
	{ value: "layer1", label: "L1", icon: null },
	{ value: "layer2", label: "L2", icon: null },
	{ value: "meme", label: "Meme", icon: null },
];

const categoryMapping: Record<string, Category[]> = {
	BTC: ["layer1", "trending"],
	ETH: ["layer1", "defi", "trending"],
	SOL: ["layer1", "trending"],
	AVAX: ["layer1"],
	NEAR: ["layer1"],
	ATOM: ["layer1"],
	DOT: ["layer1"],
	ADA: ["layer1"],
	APT: ["layer1", "new"],
	SUI: ["layer1", "new"],
	SEI: ["layer1", "new"],
	ARB: ["layer2", "defi"],
	OP: ["layer2", "defi"],
	MATIC: ["layer2"],
	BASE: ["layer2", "new"],
	AAVE: ["defi"],
	UNI: ["defi"],
	LINK: ["defi"],
	MKR: ["defi"],
	SNX: ["defi"],
	CRV: ["defi"],
	DOGE: ["meme", "trending"],
	SHIB: ["meme"],
	PEPE: ["meme", "trending"],
	BONK: ["meme"],
	WIF: ["meme", "new"],
	FLOKI: ["meme"],
};

const favoriteCoins = ["BTC", "ETH", "SOL", "ARB"];

type TokenSelectorProps = {
	value: string;
	onValueChange: (value: string) => void;
};

function formatPrice(price: string | undefined): string {
	if (!price) return "-";
	const num = Number.parseFloat(price);
	if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
	if (num >= 1) return `$${num.toFixed(2)}`;
	return `$${num.toFixed(4)}`;
}

function formatOpenInterest(oi: string | undefined): string {
	if (!oi) return "-";
	const num = Number.parseFloat(oi);
	if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
	if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
	return `$${num.toFixed(0)}`;
}

function formatFundingRate(rate: string | undefined): string {
	if (!rate) return "-";
	const num = Number.parseFloat(rate) * 100;
	return `${num >= 0 ? "+" : ""}${num.toFixed(4)}%`;
}

export function TokenSelector({ value, onValueChange }: TokenSelectorProps) {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<Category>("all");
	const [search, setSearch] = useState("");
	const { data: markets, isLoading } = useMarkets();

	const filteredMarkets = useMemo(() => {
		if (!markets) return [];

		return markets.filter((market) => {
			if (search && !market.coin.toLowerCase().includes(search.toLowerCase())) {
				return false;
			}
			if (category === "all") return true;
			if (category === "favorites") return favoriteCoins.includes(market.coin);
			if (category === "trending") {
				return categoryMapping[market.coin]?.includes("trending") ?? false;
			}
			if (category === "new") {
				return categoryMapping[market.coin]?.includes("new") ?? false;
			}
			return categoryMapping[market.coin]?.includes(category) ?? false;
		});
	}, [markets, category, search]);

	function handleSelect(coin: string) {
		onValueChange(coin);
		setOpen(false);
		setSearch("");
	}

	function handleCategorySelect(cat: Category) {
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
						<AvatarImage src={`https://app.hyperliquid.xyz/coins/${value.toLowerCase()}.svg`} alt={value} />
						<AvatarFallback className="text-3xs bg-terminal-amber/20 text-terminal-amber">
							{value.slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<span className="text-terminal-amber">{value}</span>
					<span className="text-muted-foreground">/USDC</span>
					<ChevronDown className="size-3 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-lg p-0 border-border/60 bg-surface" align="start" sideOffset={8}>
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
							{categories.map((cat) => (
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

					<div className="grid grid-cols-[1fr_80px_80px_20px] gap-2 px-3 py-1.5 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 bg-surface/30">
						<div>Market</div>
						<div className="text-right">Price</div>
						<div className="text-right">Funding</div>
						<div />
					</div>

					<Command className="bg-transparent" filter={() => 1}>
						<CommandList>
							<ScrollArea className="h-[280px]">
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
														"grid grid-cols-[1fr_80px_80px_20px] gap-2 items-center px-3 py-1.5 rounded-none cursor-pointer border-b border-border/20",
														"data-[selected=true]:bg-accent/30",
														isSelected && "bg-terminal-cyan/5",
													)}
												>
													<div className="flex items-center gap-2 min-w-0">
														<Avatar className="size-5 shrink-0">
															<AvatarImage
																src={`https://assets.hyperliquid.xyz/icons/${market.coin.toLowerCase()}.svg`}
																alt={market.coin}
															/>
															<AvatarFallback className="text-4xs bg-muted">{market.coin.slice(0, 2)}</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<div className="flex items-center gap-1">
																<span className="font-semibold text-2xs">{market.coin}</span>
																{favoriteCoins.includes(market.coin) && (
																	<Star className="size-2.5 fill-terminal-amber text-terminal-amber" />
																)}
																{categoryMapping[market.coin]?.includes("new") && (
																	<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
																		NEW
																	</Badge>
																)}
															</div>
															<div className="flex items-center gap-1.5 text-4xs text-muted-foreground">
																<span>{market.maxLeverage}x</span>
																<span className="text-muted-foreground/50">•</span>
																<span>OI {formatOpenInterest(market.openInterest)}</span>
															</div>
														</div>
													</div>
													<div className="text-right">
														<span className="text-2xs font-medium tabular-nums">{formatPrice(market.markPrice)}</span>
													</div>
													<div className="text-right">
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
																{formatFundingRate(market.fundingRate)}
															</span>
														</div>
													</div>
													<div className="flex justify-center">
														{isSelected && <Check className="size-3.5 text-terminal-cyan" />}
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
