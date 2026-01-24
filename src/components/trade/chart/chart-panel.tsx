import { ClientOnly } from "@tanstack/react-router";
import { useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { createChartName } from "@/lib/chart/candle";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useTheme } from "@/providers/theme";
import { useMarketActions } from "@/stores/use-market-store";
import { MarketOverview } from "../market-overview";
import { TokenSelector } from "./token-selector";
import { TradingViewChart } from "./trading-view-chart";

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
			<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
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
					{selectedMarket && (
						<TradingViewChart
							symbol={createChartName(selectedMarket.displayName, selectedMarket.name)}
							theme={theme === "dark" ? "dark" : "light"}
						/>
					)}
				</ClientOnly>
			</div>
		</div>
	);
}
