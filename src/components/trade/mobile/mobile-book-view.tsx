import { ArrowRightLeft, ChevronDown, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { useSubL2Book } from "@/lib/hyperliquid/hooks/subscription";
import { processLevels } from "@/lib/trade/orderbook";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { OrderbookRow } from "../orderbook/orderbook-row";
import { TradesPanel } from "../orderbook/trades-panel";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ORDERBOOK_TEXT = UI_TEXT.ORDERBOOK;

type View = "book" | "trades";

interface PriceGroupOption {
	tickSize: number;
	nSigFigs: 2 | 3 | 4 | 5;
	mantissa?: 2 | 5;
	label: string;
}

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
	return options.filter((opt) => opt.tickSize > 0 && opt.tickSize <= midPrice / 10).slice(0, 6);
}

function formatTickLabel(tickSize: number): string {
	if (tickSize >= 1) {
		return tickSize >= 1000 ? `${tickSize / 1000}K` : String(tickSize);
	}
	return String(Number(tickSize.toPrecision(4)));
}

interface MobileBookViewProps {
	className?: string;
}

export function MobileBookView({ className }: MobileBookViewProps) {
	const [view, setView] = useState<View>("book");
	const [selectedOption, setSelectedOption] = useState<PriceGroupOption | null>(null);
	const { showOrderbookInUsd } = useGlobalSettings();
	const { setShowOrderbookInUsd } = useGlobalSettingsActions();

	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });
	const { coin, szDecimals } = selectedMarket;

	const { data: book, status: bookStatus } = useSubL2Book(
		{
			coin,
			nSigFigs: selectedOption?.nSigFigs,
			mantissa: selectedOption?.mantissa,
		},
		{
			enabled: view === "book",
		},
	);

	const bids = useMemo(() => processLevels(book?.levels[0]), [book?.levels]);
	const asks = useMemo(() => processLevels(book?.levels[1]), [book?.levels]);

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

	useEffect(() => {
		if (selectedOption === null && priceGroupingOptions.length > 0) {
			setSelectedOption(priceGroupingOptions[0]);
		}
	}, [priceGroupingOptions, selectedOption]);

	return (
		<div className={cn("flex flex-col h-full min-h-0", className)}>
			{/* Header with tabs and controls */}
			<div className="shrink-0 px-3 py-2 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between">
					{/* View toggle */}
					<div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
						<Button
							variant="ghost"
							size="none"
							onClick={() => setView("book")}
							className={cn(
								"px-3 py-1.5 text-xs font-medium rounded transition-colors",
								"min-h-[36px]",
								"hover:bg-transparent",
								view === "book"
									? "bg-background text-terminal-cyan shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{ORDERBOOK_TEXT.BOOK_LABEL}
						</Button>
						<Button
							variant="ghost"
							size="none"
							onClick={() => setView("trades")}
							className={cn(
								"px-3 py-1.5 text-xs font-medium rounded transition-colors",
								"min-h-[36px]",
								"hover:bg-transparent",
								view === "trades"
									? "bg-background text-terminal-cyan shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{ORDERBOOK_TEXT.TRADES_LABEL}
						</Button>
					</div>

					{/* Controls */}
					<div className="flex items-center gap-2">
						{/* Unit toggle */}
						<Button
							variant="ghost"
							size="none"
							onClick={() => setShowOrderbookInUsd(!showOrderbookInUsd)}
							className={cn(
								"px-2 py-1.5 text-xs border border-border/60 rounded",
								"min-h-[36px] flex items-center gap-1",
								"text-muted-foreground hover:text-foreground hover:border-foreground/30",
								"hover:bg-transparent transition-colors",
							)}
							aria-label="Toggle display units"
						>
							{showOrderbookInUsd ? "USD" : coin}
							<ArrowRightLeft className="size-3" />
						</Button>

						{/* Aggregation selector */}
						{view === "book" && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="none"
										className={cn(
											"px-2 py-1.5 text-xs border border-border/60 rounded",
											"min-h-[36px] flex items-center gap-1",
											"hover:border-foreground/30 hover:bg-transparent transition-colors",
										)}
									>
										{selectedOption?.label ?? "—"}
										<ChevronDown className="size-3" />
									</Button>
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
												className="min-h-[40px]"
											>
												{option.label}
											</DropdownMenuItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
					{/* Column headers */}
					<div className="shrink-0 grid grid-cols-3 gap-2 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
						<div>{ORDERBOOK_TEXT.HEADER_PRICE}</div>
						<div className="text-right">{ORDERBOOK_TEXT.HEADER_SIZE}</div>
						<div className="text-right">{ORDERBOOK_TEXT.HEADER_TOTAL}</div>
					</div>

					{/* Order book */}
					<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
						{/* Asks - show more rows to fill mobile screen */}
						{bookStatus !== "error" && asks.length > 0 ? (
							<div className="flex-1 flex flex-col justify-end gap-px py-1 overflow-hidden">
								{asks
									.slice(0, 12)
									.reverse()
									.map((level, index) => (
										<OrderbookRow
											key={`ask-${level.price}-${index}`}
											level={level}
											side="ask"
											maxTotal={maxTotal}
											showInUsd={showOrderbookInUsd}
											szDecimals={szDecimals}
										/>
									))}
							</div>
						) : (
							<div className="flex-1 flex items-center justify-center">
								{bookStatus === "error" ? (
									<div className="text-sm text-terminal-red">{ORDERBOOK_TEXT.FAILED}</div>
								) : (
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<RefreshCw className="size-5 animate-spin" />
										<span className="text-sm">{ORDERBOOK_TEXT.WAITING}</span>
									</div>
								)}
							</div>
						)}

						{/* Mid price */}
						<div className="shrink-0 py-2 px-3 flex items-center justify-center gap-3 border-y border-border/40 bg-surface/30">
							<span className="text-xl font-bold tabular-nums text-terminal-amber terminal-glow-amber">
								{typeof mid === "number" && Number.isFinite(mid) ? formatNumber(mid, 2) : FALLBACK_VALUE_PLACEHOLDER}
							</span>
							{midDirection === "up" ? (
								<TrendingUp className="size-5 text-terminal-green" />
							) : midDirection === "down" ? (
								<TrendingDown className="size-5 text-terminal-red" />
							) : null}
						</div>

						{/* Bids - show more rows to fill mobile screen */}
						{bookStatus !== "error" && bids.length > 0 ? (
							<div className="flex-1 flex flex-col gap-px py-1 overflow-hidden">
								{bids.slice(0, 12).map((level, index) => (
									<OrderbookRow
										key={`bid-${level.price}-${index}`}
										level={level}
										side="bid"
										maxTotal={maxTotal}
										showInUsd={showOrderbookInUsd}
										szDecimals={szDecimals}
									/>
								))}
							</div>
						) : null}
					</div>

					{/* Spread */}
					<div className="shrink-0 px-3 py-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
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
				</div>
			) : (
				<div className="flex-1 min-h-0">
					<TradesPanel key={coin} />
				</div>
			)}

			<MobileBottomNavSpacer />
		</div>
	);
}
