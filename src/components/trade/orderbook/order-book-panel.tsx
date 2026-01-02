import { ArrowRightLeft, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { useL2BookSubscription } from "@/hooks/hyperliquid/socket/use-l2-book-subscription";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { formatNumber, formatUSD } from "@/lib/format";
import { buildOrderBookRows } from "@/lib/trade/orderbook";
import { cn } from "@/lib/utils";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { BookRow } from "./book-row";
import { TradesView } from "./trades-view";

const ORDERBOOK_TEXT = UI_TEXT.ORDERBOOK;

interface PriceGroupOption {
	tickSize: number;
	/** Valid values: 2, 3, 4, 5. null/undefined = full precision */
	nSigFigs: 2 | 3 | 4 | 5;
	/** Only valid when nSigFigs is 5. Valid values: 2 or 5 (omit for base tick) */
	mantissa?: 2 | 5;
	label: string;
}

/**
 * Generate price grouping options based on mid price.
 *
 * API constraints:
 * - nSigFigs: 2, 3, 4, 5, or null (full precision)
 * - mantissa: 2 or 5 (only valid when nSigFigs is 5, omit for base tick)
 *
 * Formula: tickSize = 10^(integerDigits - nSigFigs)
 *
 * Example for ATOM at $2 (integerDigits = 1):
 * - nSigFigs=5: tickSize = 10^(1-5) = 0.0001
 * - nSigFigs=4: tickSize = 10^(1-4) = 0.001
 * - nSigFigs=3: tickSize = 10^(1-3) = 0.01
 * - nSigFigs=2: tickSize = 10^(1-2) = 0.1
 *
 * With nSigFigs=5 and mantissa:
 * - omitted: base tick (0.0001)
 * - mantissa=2: 2x base tick (0.0002)
 * - mantissa=5: 5x base tick (0.0005)
 */
function generatePriceGroupingOptions(midPrice: number | undefined): PriceGroupOption[] {
	if (!midPrice || !Number.isFinite(midPrice) || midPrice <= 0) {
		return [
			{ tickSize: 1, nSigFigs: 5, label: "1" },
			{ tickSize: 2, nSigFigs: 5, mantissa: 2, label: "2" },
			{ tickSize: 5, nSigFigs: 5, mantissa: 5, label: "5" },
			{ tickSize: 10, nSigFigs: 4, label: "10" },
		];
	}

	const integerDigits = Math.floor(Math.log10(midPrice)) + 1;
	const options: PriceGroupOption[] = [];

	const base5 = 10 ** (integerDigits - 5);

	options.push({ tickSize: base5, nSigFigs: 5, label: formatTickLabel(base5) });

	options.push({ tickSize: base5 * 2, nSigFigs: 5, mantissa: 2, label: formatTickLabel(base5 * 2) });

	options.push({ tickSize: base5 * 5, nSigFigs: 5, mantissa: 5, label: formatTickLabel(base5 * 5) });

	for (let nSigFigs = 4; nSigFigs >= 2; nSigFigs--) {
		const tickSize = 10 ** (integerDigits - nSigFigs);
		options.push({ tickSize, nSigFigs: nSigFigs as 2 | 3 | 4, label: formatTickLabel(tickSize) });
	}

	options.sort((a, b) => a.tickSize - b.tickSize);

	const filtered = options.filter((opt) => opt.tickSize > 0 && opt.tickSize <= midPrice / 10);
	return filtered.slice(0, 6);
}

function formatTickLabel(tickSize: number): string {
	if (tickSize >= 1) {
		return tickSize >= 1000 ? `${tickSize / 1000}K` : String(tickSize);
	}

	const rounded = Number(tickSize.toPrecision(4));

	return String(rounded);
}

export function OrderBookPanel() {
	const [view, setView] = useState<"book" | "trades">("book");
	const [selectedOption, setSelectedOption] = useState<PriceGroupOption | null>(null);
	const { showOrderbookInUsd } = useGlobalSettings();
	const { setShowOrderbookInUsd } = useGlobalSettingsActions();

	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });
	const coin = selectedMarket?.coin ?? "BTC";
	const szDecimals = selectedMarket?.szDecimals ?? 4;

	const {
		data: book,
		status: bookStatus,
		error: bookError,
	} = useL2BookSubscription({
		params: {
			coin,
			nSigFigs: selectedOption?.nSigFigs,
			mantissa: selectedOption?.mantissa,
		},
		enabled: view === "book",
	});

	const bids = useMemo(() => buildOrderBookRows(book?.levels[0]), [book?.levels]);
	const asks = useMemo(() => buildOrderBookRows(book?.levels[1]), [book?.levels]);

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

	const prevCoinRef = useRef(coin);
	useEffect(() => {
		if (prevCoinRef.current !== coin) {
			prevCoinRef.current = coin;
			if (priceGroupingOptions.length > 0) {
				setSelectedOption(priceGroupingOptions[0]);
			}
		}

		if (selectedOption === null && priceGroupingOptions.length > 0) {
			setSelectedOption(priceGroupingOptions[0]);
		}
	}, [coin, priceGroupingOptions, selectedOption]);

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
				{view === "book" && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="px-1.5 py-0.5 text-4xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
								tabIndex={0}
								aria-label={ORDERBOOK_TEXT.SELECT_AGGREGATION_ARIA}
							>
								{selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
								<ChevronDown className="size-2.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-20 font-mono text-xs">
							{priceGroupingOptions.map((option) => {
								const isSelected =
									selectedOption?.nSigFigs === option.nSigFigs && selectedOption?.mantissa === option.mantissa;
								return (
									<DropdownMenuItem
										key={`${option.nSigFigs}-${option.mantissa ?? 0}`}
										onClick={() => setSelectedOption(option)}
										selected={isSelected}
									>
										{option.label}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 shrink-0">
						<div>{ORDERBOOK_TEXT.HEADER_PRICE}</div>
						<button
							type="button"
							onClick={() => setShowOrderbookInUsd(!showOrderbookInUsd)}
							className="text-right hover:text-foreground transition-colors inline-flex items-center justify-end gap-0.5"
						>
							{ORDERBOOK_TEXT.HEADER_SIZE}
							<span className="opacity-60">({showOrderbookInUsd ? "$" : coin})</span>
							<ArrowRightLeft className="size-2 opacity-40" />
						</button>
						<button
							type="button"
							onClick={() => setShowOrderbookInUsd(!showOrderbookInUsd)}
							className="text-right hover:text-foreground transition-colors inline-flex items-center justify-end gap-0.5"
						>
							{ORDERBOOK_TEXT.HEADER_TOTAL}
							<span className="opacity-60">({showOrderbookInUsd ? "$" : coin})</span>
							<ArrowRightLeft className="size-2 opacity-40" />
						</button>
					</div>

					<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
						{bookStatus !== "error" && asks.length > 0 ? (
							<div className="flex-1 flex flex-col justify-end gap-px py-0.5">
								{asks
									.slice(0, 9)
									.reverse()
									.map((r) => (
										<BookRow
											key={`ask-${r.price}`}
											row={r}
											type="ask"
											maxTotal={maxTotal}
											showInUsdc={showOrderbookInUsd}
											szDecimals={szDecimals}
										/>
									))}
							</div>
						) : (
							<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
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
							<div className="flex-1 flex flex-col gap-px py-0.5">
								{bids.slice(0, 11).map((r) => (
										<BookRow
											key={`bid-${r.price}`}
											row={r}
											type="bid"
											maxTotal={maxTotal}
											showInUsdc={showOrderbookInUsd}
											szDecimals={szDecimals}
										/>
									))}
							</div>
						) : null}
					</div>

					<div className="mt-auto shrink-0 px-2 py-1.5 border-t border-border/40 flex items-center justify-between text-4xs text-muted-foreground">
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
