import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentPanelSizes } from "@/hooks/trade/use-persistent-layout";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

export function AnalysisSection() {
	const { sizes, onSizesChange } = usePersistentPanelSizes("CHART_WITH_POSITIONS");

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="vertical" className="h-full min-h-0" onLayout={onSizesChange}>
				<ResizablePanel defaultSize={sizes[0]} minSize={30}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50"
				/>
				<ResizablePanel defaultSize={sizes[1]} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
