import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMetaAndAssetCtxs } from "@/hooks/hyperliquid";
import { cn } from "@/lib/utils";
import { type Market, markets } from "../lib";

export function TickerStrip() {
	const marketsInfoQuery = useMetaAndAssetCtxs();

	console.log(marketsInfoQuery.data);
	const [activeSymbol, setActiveSymbol] = useState(markets[0]?.symbol ?? "");

	function handleSelect(symbol: string) {
		setActiveSymbol(symbol);
	}

	return (
		<div className="h-8 border-b border-border/60 bg-surface/20">
			<ScrollArea className="w-full h-full">
				<div className="h-8 flex items-center gap-0.5 px-2 min-w-full">
					{markets.map((m) => (
						<MarketChip key={m.symbol} market={m} isActive={m.symbol === activeSymbol} onSelect={handleSelect} />
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

type MarketChipProps = {
	market: Market;
	isActive: boolean;
	onSelect: (symbol: string) => void;
};

function MarketChip({ market, isActive, onSelect }: MarketChipProps) {
	const isPositive = market.changePct >= 0;

	function handleClick() {
		onSelect(market.symbol);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(market.symbol);
		}
	}

	return (
		<button
			type="button"
			className={cn(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-1 text-3xs transition-colors cursor-pointer",
				"hover:bg-accent/50 border-r border-border/40",
				isActive && "bg-terminal-cyan/10",
			)}
			tabIndex={0}
			aria-label={`${market.symbol} ${isPositive ? "up" : "down"} ${Math.abs(market.changePct)}%`}
			aria-pressed={isActive}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			<span className={cn("font-medium", isActive ? "text-terminal-cyan" : "text-foreground")}>{market.base}</span>
			<span className="text-muted-foreground tabular-nums">${market.price.toLocaleString()}</span>
			<span className={cn("tabular-nums font-medium", isPositive ? "text-terminal-green" : "text-terminal-red")}>
				{isPositive ? "+" : ""}
				{market.changePct.toFixed(2)}%
			</span>
		</button>
	);
}
