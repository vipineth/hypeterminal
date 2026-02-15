import { ClientOnly } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { useTheme } from "@/stores/use-global-settings-store";
import { MarketOverview } from "../market-overview";

const TradingViewChart = createLazyComponent(() => import("./tradingview-chart"), "TradingViewChart");
const KlineChart = createLazyComponent(() => import("./kline-chart"), "KlineChart");

type ChartType = "default" | "tradingview";

export function ChartPanel() {
	const theme = useTheme();
	const { data: selectedMarket } = useSelectedMarketInfo();
	const [chartType, setChartType] = useState<ChartType>("default");
	const chartTheme = theme === "dark" ? "dark" : "light";

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-2.5 border-b border-border-200/85 bg-surface-analysis">
				<div className="flex items-center justify-between gap-2">
					<MarketOverview />
					<div className="flex items-center gap-1 text-3xs">
						<button
							type="button"
							onClick={() => setChartType("default")}
							className={cn(
								"px-1.5 py-0.5 rounded-xs transition-colors",
								chartType === "default" ? "text-text-950 font-semibold" : "text-text-500 hover:text-text-950",
							)}
						>
							Default
						</button>
						<button
							type="button"
							onClick={() => setChartType("tradingview")}
							onMouseEnter={() => TradingViewChart.preload()}
							onFocus={() => TradingViewChart.preload()}
							className={cn(
								"px-1.5 py-0.5 rounded-xs transition-colors",
								chartType === "tradingview" ? "text-text-950 font-semibold" : "text-text-500 hover:text-text-950",
							)}
						>
							TradingView
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<ClientOnly>
					<Suspense fallback={<ChartLoadingFallback />}>
						{chartType === "default" && selectedMarket && (
							<KlineChart symbol={selectedMarket.name} theme={chartTheme} />
						)}
						{chartType === "tradingview" && selectedMarket && (
							<TradingViewChart symbol={selectedMarket.name} theme={chartTheme} />
						)}
					</Suspense>
				</ClientOnly>
			</div>
		</div>
	);
}

function ChartLoadingFallback() {
	return (
		<div className="h-full w-full flex items-center justify-center bg-surface-base/20">
			<Skeleton className="h-full w-full" />
		</div>
	);
}
