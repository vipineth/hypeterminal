import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function MarketInfo() {
	const { defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_ORDERBOOK");

	const { data: market } = useSelectedMarketInfo();
	const orderbookKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation="horizontal"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel defaultSize="76" minSize="300px">
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="w-px bg-border/40 hover:bg-info/30 active:bg-info/50" />
				<ResizablePanel defaultSize="24" minSize="200px" maxSize="400px">
					<OrderbookPanel key={orderbookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
