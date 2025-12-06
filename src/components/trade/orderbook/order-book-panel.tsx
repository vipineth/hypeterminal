import { ChevronDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { asks, bids } from "../lib";
import { BookRow } from "./book-row";
import { TradesView } from "./trades-view";

export function OrderBookPanel() {
	const [tick, setTick] = useState("0.01");
	const [view, setView] = useState<"book" | "trades">("book");
	const maxTotal = Math.max(...[...asks, ...bids].map((r) => r.total));

	return (
		<div className="h-full min-h-0 flex flex-col overflow-hidden border-l border-border/40">
			<div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-card/30">
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						onClick={() => setView("book")}
						className={cn(
							"px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
							view === "book" ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
						)}
						tabIndex={0}
						aria-label="Order Book"
					>
						Book
					</button>
					<button
						type="button"
						onClick={() => setView("trades")}
						className={cn(
							"px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
							view === "trades" ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
						)}
						tabIndex={0}
						aria-label="Recent Trades"
					>
						Trades
					</button>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-1.5 py-0.5 text-[9px] border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select tick size"
						>
							{tick}
							<ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-20 font-mono text-xs">
						{["0.01", "0.05", "0.1"].map((t) => (
							<DropdownMenuItem key={t} onClick={() => setTick(t)}>
								{t}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-2 px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 shrink-0">
						<div>Price</div>
						<div className="text-right">Size</div>
						<div className="text-right">Total</div>
					</div>

					<div className="flex-1 min-h-0 flex flex-col">
						<ScrollArea className="flex-1 min-h-0">
							<div className="px-2 py-1 flex flex-col justify-end min-h-full">
								<div className="space-y-px">
									{asks
										.slice(0, 12)
										.reverse()
										.map((r) => (
											<BookRow key={`ask-${r.price}`} row={r} type="ask" maxTotal={maxTotal} />
										))}
								</div>
							</div>
						</ScrollArea>

						<div className="shrink-0 py-1.5 px-2 flex items-center justify-center gap-2 border-y border-border/40 bg-card/30">
							<span className="text-sm font-semibold tabular-nums text-terminal-amber terminal-glow-amber">102.45</span>
							<TrendingUp className="size-3 text-terminal-green" />
							<span className="text-[9px] text-muted-foreground">≈ $102.45</span>
						</div>

						<ScrollArea className="flex-1 min-h-0">
							<div className="px-2 py-1">
								<div className="space-y-px">
									{bids.slice(0, 12).map((r) => (
										<BookRow key={`bid-${r.price}`} row={r} type="bid" maxTotal={maxTotal} />
									))}
								</div>
							</div>
						</ScrollArea>
					</div>

					<div className="shrink-0 px-2 py-1.5 border-t border-border/40 flex items-center justify-between text-[9px] text-muted-foreground">
						<span>Spread</span>
						<span className="tabular-nums text-terminal-amber">0.05 (0.05%)</span>
					</div>
				</div>
			) : (
				<TradesView />
			)}
		</div>
	);
}

