import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { useL2BookSubscription } from "@/hooks/hyperliquid/socket/use-l2-book-subscription";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { formatNumber, formatUSD } from "@/lib/format";
import { buildOrderBookRows } from "@/lib/trade/orderbook";
import { cn } from "@/lib/utils";
import { BookRow } from "./book-row";
import { TradesView } from "./trades-view";

const ORDERBOOK_TEXT = UI_TEXT.ORDERBOOK;

function generatePriceGroupingOptions(midPrice: number | undefined): Array<{ tickSize: number; nSigFigs: number }> {
	if (!midPrice || !Number.isFinite(midPrice) || midPrice <= 0) {
		return [
			{ tickSize: 0, nSigFigs: 5 },
			{ tickSize: 0, nSigFigs: 4 },
			{ tickSize: 0, nSigFigs: 3 },
			{ tickSize: 0, nSigFigs: 2 },
		];
	}

	const orderOfMagnitude = Math.floor(Math.log10(midPrice));
	const options: Array<{ tickSize: number; nSigFigs: number }> = [];

	for (let i = 0; i < 4; i++) {
		const exponent = orderOfMagnitude - i - 1;
		const tickSize = 10 ** exponent;
		const nSigFigs = Math.max(2, Math.min(5, 5 - i));
		options.push({ tickSize, nSigFigs: nSigFigs as 2 | 3 | 4 | 5 });
	}

	return options;
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
						aria-label={ORDERBOOK_TEXT.ORDER_BOOK_ARIA}
					>
						{ORDERBOOK_TEXT.BOOK_LABEL}
					</button>
					<button
						type="button"
						onClick={() => setView("trades")}
						className={cn(
							"px-2 py-1 text-3xs uppercase tracking-wider transition-colors",
							view === "trades" ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
						)}
						tabIndex={0}
						aria-label={ORDERBOOK_TEXT.RECENT_TRADES_ARIA}
					>
						{ORDERBOOK_TEXT.TRADES_LABEL}
					</button>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-1.5 py-0.5 text-4xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label={ORDERBOOK_TEXT.SELECT_AGGREGATION_ARIA}
						>
							{nSigFigs
								? priceGroupingOptions.find((opt) => opt.nSigFigs === nSigFigs)?.tickSize
									? formatNumber(priceGroupingOptions.find((opt) => opt.nSigFigs === nSigFigs)?.tickSize, 8)
									: `${nSigFigs ?? 0} ${ORDERBOOK_TEXT.SIG_FIGS_SUFFIX}`
								: ORDERBOOK_TEXT.AUTO_LABEL}
							<ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-24 font-mono text-xs">
						<DropdownMenuItem onClick={() => setNSigFigs(undefined)}>{ORDERBOOK_TEXT.AUTO_LABEL}</DropdownMenuItem>
						{priceGroupingOptions.map((option) => (
							<DropdownMenuItem key={option.nSigFigs} onClick={() => setNSigFigs(option.nSigFigs as 2 | 3 | 4 | 5)}>
								{option.tickSize > 0
									? formatNumber(option.tickSize, 8)
									: `${option.nSigFigs} ${ORDERBOOK_TEXT.SIG_FIGS_SUFFIX}`}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 shrink-0">
						<div>{ORDERBOOK_TEXT.HEADER_PRICE}</div>
						<div className="text-right">{ORDERBOOK_TEXT.HEADER_SIZE}</div>
						<div className="text-right">{ORDERBOOK_TEXT.HEADER_TOTAL}</div>
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
								{bookStatus === "error" ? ORDERBOOK_TEXT.FAILED : ORDERBOOK_TEXT.WAITING}
							</div>
						)}

						<div className="shrink-0 py-1.5 px-2 flex items-center justify-center gap-2 border-y border-border/40 bg-surface/30">
							<span className="text-sm font-semibold tabular-nums text-terminal-amber terminal-glow-amber">
								{typeof mid === "number" && Number.isFinite(mid) ? formatNumber(mid, 2) : FALLBACK_VALUE_PLACEHOLDER}
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
									? `${ORDERBOOK_TEXT.APPROX_PREFIX}${formatUSD(mid, { digits: 2, compact: false })}`
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
						<span>{ORDERBOOK_TEXT.SPREAD_LABEL}</span>
						<span className="tabular-nums text-terminal-amber">
							{typeof spread === "number" &&
							Number.isFinite(spread) &&
							typeof spreadPct === "number" &&
							Number.isFinite(spreadPct)
								? `${formatNumber(spread, 2)} (${formatNumber(spreadPct, 3)}%)`
								: FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
					{bookStatus === "error" ? (
						<div className="shrink-0 px-2 pb-1.5 text-4xs text-terminal-red/80">
							{bookError instanceof Error ? bookError.message : ORDERBOOK_TEXT.WEBSOCKET_ERROR}
						</div>
					) : null}
				</div>
			) : (
				<TradesView />
			)}
		</div>
	);
}
