import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type Market, markets } from "../lib";

export function TickerStrip() {
	return (
		<div className="h-8 border-b border-border/60 bg-surface/20">
			<ScrollArea className="w-full h-full">
				<div className="h-8 flex items-center gap-0.5 px-2 min-w-full">
					{markets.map((m) => (
						<MarketChip key={m.symbol} market={m} />
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

function MarketChip({ market }: { market: Market }) {
	const isPositive = market.changePct >= 0;
	return (
		<button
			type="button"
			className={cn(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-1 text-3xs transition-colors",
				"hover:bg-accent/50 border-r border-border/40",
			)}
			tabIndex={0}
			aria-label={`${market.symbol} ${isPositive ? "up" : "down"} ${Math.abs(market.changePct)}%`}
		>
			<span className="font-medium text-foreground">{market.base}</span>
			<span className="text-muted-foreground tabular-nums">${market.price.toLocaleString()}</span>
			<span className={cn("tabular-nums font-medium", isPositive ? "text-terminal-green" : "text-terminal-red")}>
				{isPositive ? "+" : ""}
				{market.changePct.toFixed(2)}%
			</span>
		</button>
	);
}
