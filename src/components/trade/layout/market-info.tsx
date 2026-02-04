import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentPanelSizes } from "@/hooks/trade/use-persistent-layout";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function MarketInfo() {
	const { sizes, onSizesChange } = usePersistentPanelSizes("CHART_WITH_ORDERBOOK");

	const { data: market } = useSelectedMarketInfo();
	const orderbookKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onSizesChange}>
				<ResizablePanel defaultSize={sizes[0]} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50" />
				<ResizablePanel defaultSize={sizes[1]} minSize={20}>
					<OrderbookPanel key={orderbookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
