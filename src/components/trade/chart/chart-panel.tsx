import { ClientOnly } from "@tanstack/react-router";
import { Suspense, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createChartName } from "@/lib/chart/candle";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { useTheme } from "@/providers/theme";
import { useMarketActions } from "@/stores/use-market-store";
import { MarketOverview } from "../market-overview";
import { TokenSelector } from "./token-selector";

const TradingViewChart = createLazyComponent(() => import("./tradingview-chart"), "TradingViewChart");

export function ChartPanel() {
	const { theme } = useTheme();
	const { data: selectedMarket } = useSelectedMarketInfo();
	const { setSelectedMarket } = useMarketActions();

	const handleMarketChange = useCallback(
		(marketName: string) => {
			setSelectedMarket(marketName);
		},
		[setSelectedMarket],
	);

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="h-9 px-2 py-1.5 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-0.5 min-w-0">
						<TokenSelector selectedMarket={selectedMarket} onValueChange={handleMarketChange} />
						<Separator orientation="vertical" className="mx-1 h-4" />
						<MarketOverview />
					</div>
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
		<div className="h-full w-full flex items-center justify-center bg-surface/20">
			<Skeleton className="h-full w-full" />
		</div>
	);
}
