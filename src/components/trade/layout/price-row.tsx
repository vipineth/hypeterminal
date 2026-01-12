import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PERSISTENCE } from "@/config/constants";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { ChartPanel } from "../chart/chart-panel";
import { OrderbookPanel } from "../orderbook/orderbook-panel";

export function PriceRow() {
	const layout = LAYOUT_PERSISTENCE.CHART_BOOK;
	const { layout: horizLayout, onLayout: onHorizLayout } = usePersistentLayout(layout.KEY, layout.FALLBACK);

	const { data: market } = useSelectedResolvedMarket({ ctxMode: "none" });
	const bookKey = market?.coin ?? "default";

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onHorizLayout}>
				<ResizablePanel defaultSize={horizLayout[0] ?? layout.PANEL_DEFAULTS[0]} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50" />
				<ResizablePanel defaultSize={horizLayout[1] ?? layout.PANEL_DEFAULTS[1]} minSize={20}>
					<OrderbookPanel key={bookKey} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
