import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PRESETS, usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function MarketInfo() {
	const layoutPreset = LAYOUT_PRESETS.MARKET_INFO;
	const { sizes, handleLayoutChange } = usePersistentLayout(layoutPreset.storageKey, layoutPreset.fallbackSizes);

	const { data: market } = useSelectedResolvedMarket({ ctxMode: "none" });
	const orderbookKey = market?.coin ?? "default";

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={handleLayoutChange}>
				<ResizablePanel defaultSize={sizes[0] ?? layoutPreset.defaultSizes[0]} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50" />
				<ResizablePanel defaultSize={sizes[1] ?? layoutPreset.defaultSizes[1]} minSize={20}>
					<OrderbookPanel key={orderbookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
