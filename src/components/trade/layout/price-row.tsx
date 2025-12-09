import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "../lib";
import { ChartPanel } from "../chart/chart-panel";
import { OrderBookPanel } from "../orderbook/order-book-panel";

export function PriceRow() {
	const { layout: horizLayout, onLayout: onHorizLayout } = usePersistentLayout("terminal:layout:chart-book", [75, 25]);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onHorizLayout}>
				<ResizablePanel defaultSize={horizLayout[0] ?? 70} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50" />
				<ResizablePanel defaultSize={horizLayout[1] ?? 30} minSize={20}>
					<OrderBookPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

