import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function MarketInfo() {
	const { config, defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_ORDERBOOK");
	const [first, second] = config.panels;

	const { data: market } = useSelectedMarketInfo();
	const orderbookKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation={config.orientation}
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel id={first.id} defaultSize={first.defaultSize} minSize={first.minSize}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="w-px bg-border/40" />
				<ResizablePanel
					id={second.id}
					defaultSize={second.defaultSize}
					minSize={second.minSize}
					maxSize={second.maxSize}
				>
					<OrderbookPanel key={orderbookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
