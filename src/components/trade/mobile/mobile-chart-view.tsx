import { ClientOnly } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_MARKET_KEY, UI_TEXT } from "@/config/interface";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { makePerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import { useTheme } from "@/providers/theme";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { QUOTE_ASSET } from "../chart/constants";
import { TokenSelector } from "../chart/token-selector";
import { TradingViewChart } from "../chart/trading-view-chart";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const overviewText = UI_TEXT.MARKET_OVERVIEW;

interface MobileChartViewProps {
	className?: string;
}

export function MobileChartView({ className }: MobileChartViewProps) {
	const { theme } = useTheme();
	const { data: selectedMarket, isLoading } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const selectedCoin = selectedMarket?.coin ?? perpCoinFromMarketKey(DEFAULT_MARKET_KEY);
	const { setSelectedMarketKey } = useMarketPrefsActions();

	const handleCoinChange = useCallback(
		(coin: string) => {
			setSelectedMarketKey(makePerpMarketKey(coin));
		},
		[setSelectedMarketKey],
	);

	const fundingNum = selectedMarket?.ctxNumbers?.funding ?? 0;
	const isFundingPositive = fundingNum >= 0;
	const markPx = selectedMarket?.ctxNumbers?.markPx;
	const change24h = calculate24hPriceChange(selectedMarket?.ctxNumbers);

	return (
		<div className={cn("flex flex-col h-full min-h-0", className)}>
			{/* Market selector header */}
			<div className="shrink-0 px-3 py-2 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-3">
					<TokenSelector value={selectedCoin} onValueChange={handleCoinChange} />

					{/* Price and change */}
					<div className="flex items-center gap-3 text-right">
						{isLoading ? (
							<Skeleton className="h-6 w-24" />
						) : (
							<>
								<div className="text-lg font-semibold tabular-nums text-terminal-amber terminal-glow-amber">
									{formatUSD(markPx ?? null)}
								</div>
								{typeof change24h === "number" && (
									<span
										className={cn(
											"text-sm tabular-nums font-medium",
											change24h >= 0 ? "text-terminal-green" : "text-terminal-red",
										)}
									>
										{change24h >= 0 ? "+" : ""}
										{change24h.toFixed(2)}%
									</span>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Stats bar - horizontal scrollable on mobile */}
			<div className="shrink-0 px-3 py-1.5 border-b border-border/40 bg-surface/20 overflow-x-auto">
				<div className="flex items-center gap-4 text-xs min-w-max">
					{isLoading ? (
						<>
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
						</>
					) : (
						<>
							<StatPill
								label={overviewText.LABEL_ORACLE}
								value={formatUSD(selectedMarket?.ctxNumbers?.oraclePx ?? null)}
							/>
							<StatPill
								label={overviewText.LABEL_VOLUME}
								value={formatUSD(selectedMarket?.ctxNumbers?.dayNtlVlm ?? null, {
									notation: "compact",
									compactDisplay: "short",
								})}
							/>
							<StatPill
								label={overviewText.LABEL_OPEN_INTEREST}
								value={formatUSD(calculateOpenInterestUSD(selectedMarket?.ctxNumbers), {
									notation: "compact",
									compactDisplay: "short",
								})}
							/>
							<div className="flex items-center gap-1">
								<Flame className={cn("size-3", isFundingPositive ? "text-terminal-green" : "text-terminal-red")} />
								<span
									className={cn(
										"tabular-nums font-medium",
										isFundingPositive ? "text-terminal-green" : "text-terminal-red",
									)}
								>
									{formatPercent(fundingNum, {
										minimumFractionDigits: 4,
										signDisplay: "exceptZero",
									})}
								</span>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Chart */}
			<div className="flex-1 min-h-0">
				<ClientOnly
					fallback={
						<div className="h-full flex items-center justify-center">
							<ChartSkeleton />
						</div>
					}
				>
					<TradingViewChart symbol={`${selectedCoin}/${QUOTE_ASSET}`} theme={theme === "dark" ? "dark" : "light"} />
				</ClientOnly>
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}

function StatPill({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</span>
			<span className="tabular-nums text-foreground">{value}</span>
		</div>
	);
}

function ChartSkeleton() {
	return (
		<div className="w-full h-full p-4 space-y-4">
			<div className="flex justify-between items-center">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-24" />
			</div>
			<Skeleton className="h-[calc(100%-4rem)] w-full" />
		</div>
	);
}
