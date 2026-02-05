import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

export function AnalysisSection() {
	const { defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_POSITIONS");

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation="vertical"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel defaultSize="60" minSize="200px">
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle withHandle className="h-px bg-border/40 hover:bg-info/30 active:bg-info/50" />
				<ResizablePanel defaultSize="40" minSize="150px">
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
