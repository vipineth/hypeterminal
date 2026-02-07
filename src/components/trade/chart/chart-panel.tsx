import { ClientOnly } from "@tanstack/react-router";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createChartName } from "@/lib/chart/candle";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { useTheme } from "@/providers/theme";
import { MarketOverview } from "../market-overview";

const TradingViewChart = createLazyComponent(() => import("./tradingview-chart"), "TradingViewChart");

export function ChartPanel() {
	const { theme } = useTheme();
	const { data: selectedMarket } = useSelectedMarketInfo();

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-2.5 border-b border-border/85 bg-surface-500">
				<div className="flex items-center justify-between gap-2">
					<MarketOverview />
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<ClientOnly>
					<Suspense fallback={<ChartLoadingFallback />}>
						{selectedMarket && (
							<TradingViewChart
								symbol={createChartName(selectedMarket.displayName, selectedMarket.name)}
								theme={theme === "dark" ? "dark" : "light"}
							/>
						)}
					</Suspense>
				</ClientOnly>
			</div>
		</div>
	);
}

function ChartLoadingFallback() {
	return (
		<div className="h-full w-full flex items-center justify-center bg-surface-200/20">
			<Skeleton className="h-full w-full" />
		</div>
	);
}
