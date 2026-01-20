import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PRESETS, usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

export function AnalysisSection() {
	const layoutPreset = LAYOUT_PRESETS.ANALYSIS_STACK;
	const { sizes, handleLayoutChange } = usePersistentLayout(layoutPreset.storageKey, layoutPreset.fallbackSizes);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="vertical" className="h-full min-h-0" onLayout={handleLayoutChange}>
				<ResizablePanel defaultSize={sizes[0] ?? layoutPreset.defaultSizes[0]} minSize={30}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50"
				/>
				<ResizablePanel defaultSize={sizes[1] ?? layoutPreset.defaultSizes[1]} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
