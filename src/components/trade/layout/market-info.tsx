import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function MarketInfo() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: "CHART_WITH_ORDERBOOK" });
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
				<ResizablePanel defaultSize={76} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50" />
				<ResizablePanel defaultSize={24} minSize={20}>
					<OrderbookPanel key={orderbookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
