import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useL2BookSubscription, useSelectedResolvedMarket } from "@/hooks/hyperliquid";
import { formatNumber, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderBookRow } from "../lib";
import { BookRow } from "./book-row";
import { TradesView } from "./trades-view";

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

/**
 * Generates price grouping options based on the current market price.
 * Returns an array of tick sizes and their corresponding significant figures.
 *
 * For example:
 * - Price ~$100,000 (BTC) → [100, 10, 1, 0.1]
 * - Price ~$3,000 (ETH) → [10, 1, 0.1, 0.01]
 * - Price ~$1 → [0.1, 0.01, 0.001, 0.0001]
 * - Price ~$0.0001 → [0.00001, 0.000001, 0.0000001, 0.00000001]
 */
function generatePriceGroupingOptions(midPrice: number | undefined): Array<{ tickSize: number; nSigFigs: number }> {
	if (!midPrice || !Number.isFinite(midPrice) || midPrice <= 0) {
		// Fallback to default sig figs when no price available
		return [
			{ tickSize: 0, nSigFigs: 5 },
			{ tickSize: 0, nSigFigs: 4 },
			{ tickSize: 0, nSigFigs: 3 },
			{ tickSize: 0, nSigFigs: 2 },
		];
	}

	// Find the order of magnitude of the price
	const orderOfMagnitude = Math.floor(Math.log10(midPrice));

	// Generate 4 tick size options based on the price
	const options: Array<{ tickSize: number; nSigFigs: number }> = [];

	// Start from the order of magnitude and go down
	for (let i = 0; i < 4; i++) {
		const exponent = orderOfMagnitude - i - 1;
		const tickSize = Math.pow(10, exponent);

		// Calculate corresponding sig figs
		// More precision (smaller tick) = more sig figs
		const nSigFigs = Math.max(2, Math.min(5, 5 - i));

		options.push({ tickSize, nSigFigs: nSigFigs as 2 | 3 | 4 | 5 });
	}

	return options;
}

function buildOrderBookRows(
	levels: Array<{ px: unknown; sz: unknown }> | undefined,
	side: "bid" | "ask",
): OrderBookRow[] {
	if (!levels || levels.length === 0) return [];

	const sorted = [...levels].sort((a, b) => {
		const aPx = parseNumber(a.px);
		const bPx = parseNumber(b.px);
		return side === "bid" ? bPx - aPx : aPx - bPx;
	});

	let cumulative = 0;
	return sorted.map((level) => {
		const price = parseNumber(level.px);
		const size = parseNumber(level.sz);
		cumulative += Number.isFinite(size) ? size : 0;
		return { price, size, total: cumulative };
	});
}

export function OrderBookPanel() {
	const [view, setView] = useState<"book" | "trades">("book");
	const [nSigFigs, setNSigFigs] = useState<2 | 3 | 4 | 5 | undefined>(5);

	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });
	const coin = selectedMarket?.coin ?? "BTC";
	const {
		data: book,
		status: bookStatus,
		error: bookError,
	} = useL2BookSubscription({
		params: { coin, nSigFigs },
		enabled: view === "book",
	});

	const bids = useMemo(() => buildOrderBookRows(book?.levels[0], "bid"), [book?.levels]);
	const asks = useMemo(() => buildOrderBookRows(book?.levels[1], "ask"), [book?.levels]);

	const maxTotal = useMemo(() => {
		const totals = [...asks, ...bids].map((r) => r.total);
		return totals.length > 0 ? Math.max(...totals) : 0;
	}, [asks, bids]);

	const bestBid = bids[0]?.price;
	const bestAsk = asks[0]?.price;
	const mid = useMemo(() => {
		if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk)) return undefined;
		return (bestBid + bestAsk) / 2;
	}, [bestBid, bestAsk]);

	const [midDirection, setMidDirection] = useState<"up" | "down" | "flat">("flat");
	const lastMidRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (typeof mid !== "number" || !Number.isFinite(mid)) return;
		const last = lastMidRef.current;
		if (typeof last === "number" && Number.isFinite(last)) {
			if (mid > last) setMidDirection("up");
			else if (mid < last) setMidDirection("down");
			else setMidDirection("flat");
		}
		lastMidRef.current = mid;
	}, [mid]);

	const spread = useMemo(() => {
		if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk)) return undefined;
		return bestAsk - bestBid;
	}, [bestAsk, bestBid]);

	const spreadPct = useMemo(() => {
		if (
			typeof spread !== "number" ||
			typeof mid !== "number" ||
			!Number.isFinite(spread) ||
			!Number.isFinite(mid) ||
			mid === 0
		) {
			return undefined;
		}
		return (spread / mid) * 100;
	}, [spread, mid]);

	const priceGroupingOptions = useMemo(() => generatePriceGroupingOptions(mid), [mid]);

	return (
		<div className="h-full min-h-0 flex flex-col overflow-hidden border-l border-border/40">
			<div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-surface/30">
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						onClick={() => setView("book")}
						className={cn(
							"px-2 py-1 text-3xs uppercase tracking-wider transition-colors",
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
							"px-2 py-1 text-3xs uppercase tracking-wider transition-colors",
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
							className="px-1.5 py-0.5 text-4xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select order book aggregation"
						>
							{nSigFigs ? (
								priceGroupingOptions.find((opt) => opt.nSigFigs === nSigFigs)?.tickSize ? (
									formatNumber(priceGroupingOptions.find((opt) => opt.nSigFigs === nSigFigs)!.tickSize, 8)
								) : (
									`${nSigFigs} sig figs`
								)
							) : (
								"Auto"
							)}
							<ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-24 font-mono text-xs">
						<DropdownMenuItem onClick={() => setNSigFigs(undefined)}>Auto</DropdownMenuItem>
						{priceGroupingOptions.map((option) => (
							<DropdownMenuItem key={option.nSigFigs} onClick={() => setNSigFigs(option.nSigFigs as 2 | 3 | 4 | 5)}>
								{option.tickSize > 0 ? formatNumber(option.tickSize, 8) : `${option.nSigFigs} sig figs`}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 shrink-0">
						<div>Price</div>
						<div className="text-right">Size</div>
						<div className="text-right">Total</div>
					</div>

					<div className="flex-1 min-h-0 flex flex-col">
						{bookStatus !== "error" && asks.length > 0 ? (
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
						) : (
							<div className="flex-1 min-h-0 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
								{bookStatus === "error" ? "Failed to load order book." : "Waiting for order book..."}
							</div>
						)}

						<div className="shrink-0 py-1.5 px-2 flex items-center justify-center gap-2 border-y border-border/40 bg-surface/30">
							<span className="text-sm font-semibold tabular-nums text-terminal-amber terminal-glow-amber">
								{typeof mid === "number" && Number.isFinite(mid) ? formatNumber(mid, 2) : "-"}
							</span>
							{midDirection === "up" ? (
								<TrendingUp className="size-3 text-terminal-green" />
							) : midDirection === "down" ? (
								<TrendingDown className="size-3 text-terminal-red" />
							) : (
								<TrendingUp className="size-3 text-muted-foreground/50" />
							)}
							<span className="text-4xs text-muted-foreground">
								{typeof mid === "number" && Number.isFinite(mid)
									? `≈ ${formatUSD(mid, { digits: 2, compact: false })}`
									: ""}
							</span>
						</div>

						{bookStatus !== "error" && bids.length > 0 ? (
							<ScrollArea className="flex-1 min-h-0">
								<div className="px-2 py-1">
									<div className="space-y-px">
										{bids.slice(0, 12).map((r) => (
											<BookRow key={`bid-${r.price}`} row={r} type="bid" maxTotal={maxTotal} />
										))}
									</div>
								</div>
							</ScrollArea>
						) : null}
					</div>

					<div className="shrink-0 px-2 py-1.5 border-t border-border/40 flex items-center justify-between text-4xs text-muted-foreground">
						<span>Spread</span>
						<span className="tabular-nums text-terminal-amber">
							{typeof spread === "number" &&
							Number.isFinite(spread) &&
							typeof spreadPct === "number" &&
							Number.isFinite(spreadPct)
								? `${formatNumber(spread, 2)} (${formatNumber(spreadPct, 3)}%)`
								: "-"}
						</span>
					</div>
					{bookStatus === "error" ? (
						<div className="shrink-0 px-2 pb-1.5 text-4xs text-terminal-red/80">
							{bookError instanceof Error ? bookError.message : "WebSocket error"}
						</div>
					) : null}
				</div>
			) : (
				<TradesView />
			)}
		</div>
	);
}
