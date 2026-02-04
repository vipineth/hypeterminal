import { Fire } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_TEXT } from "@/config/constants";
import { get24hChange, getOiUsd } from "@/domain/market";
import { createChartName } from "@/lib/chart/candle";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass, toBig } from "@/lib/trade/numbers";
import { useTheme } from "@/providers/theme";
import { useMarketActions } from "@/stores/use-market-store";
import { TokenSelector } from "../chart/token-selector";
import { TradingViewChart } from "../chart/trading-view-chart";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const overviewText = UI_TEXT.MARKET_OVERVIEW;

interface MobileChartViewProps {
	className?: string;
}

export function MobileChartView({ className }: MobileChartViewProps) {
	const { theme, colorTheme } = useTheme();
	const { data: selectedMarket, isLoading } = useSelectedMarketInfo();
	const { setSelectedMarket } = useMarketActions();

	const handleMarketChange = useCallback(
		(marketName: string) => {
			setSelectedMarket(marketName);
		},
		[setSelectedMarket],
	);

	const fundingNum = toBig(selectedMarket?.funding)?.toNumber() ?? 0;
	const markPx = selectedMarket?.markPx;
	const change24h = get24hChange(selectedMarket?.prevDayPx, selectedMarket?.markPx);
	const oiUsd = getOiUsd(selectedMarket?.openInterest, selectedMarket?.markPx);

	return (
		<div className={cn("flex flex-col h-full min-h-0", className)}>
			<div className="shrink-0 px-3 py-2 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-3">
					<TokenSelector selectedMarket={selectedMarket} onValueChange={handleMarketChange} />

					<div className="flex items-center gap-3 text-right">
						{isLoading ? (
							<Skeleton className="h-6 w-24" />
						) : (
							<>
								<div className="text-lg font-semibold tabular-nums text-warning">{formatUSD(markPx ?? null)}</div>
								{typeof change24h === "number" && (
									<span className={cn("text-sm tabular-nums font-medium", getValueColorClass(change24h))}>
										{change24h >= 0 ? "+" : ""}
										{change24h.toFixed(2)}%
									</span>
								)}
							</>
						)}
					</div>
				</div>
			</div>

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
							<StatPill label={overviewText.LABEL_ORACLE} value={formatUSD(selectedMarket?.oraclePx)} />
							<StatPill
								label={overviewText.LABEL_VOLUME}
								value={formatUSD(selectedMarket?.dayNtlVlm, {
									notation: "compact",
									compactDisplay: "short",
								})}
							/>
							<StatPill
								label={overviewText.LABEL_OPEN_INTEREST}
								value={formatUSD(oiUsd, {
									notation: "compact",
									compactDisplay: "short",
								})}
							/>
							<div className="flex items-center gap-1">
								<Fire className={cn("size-3", getValueColorClass(fundingNum))} />
								<span className={cn("tabular-nums font-medium", getValueColorClass(fundingNum))}>
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

			<div className="flex-1 min-h-0">
				<ClientOnly
					fallback={
						<div className="h-full flex items-center justify-center">
							<ChartSkeleton />
						</div>
					}
				>
					{selectedMarket && (
						<TradingViewChart
							symbol={createChartName(selectedMarket.displayName, selectedMarket.name)}
							theme={theme === "dark" ? "dark" : "light"}
							colorTheme={colorTheme}
						/>
					)}
				</ClientOnly>
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}

function StatPill({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-fg uppercase tracking-wider text-[10px]">{label}</span>
			<span className="tabular-nums text-fg">{value}</span>
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
