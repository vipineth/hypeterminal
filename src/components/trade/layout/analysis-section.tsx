import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

export function AnalysisSection() {
	const { config, defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_POSITIONS");
	const [first, second] = config.panels;

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation={config.orientation}
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel id={first.id} defaultSize={first.defaultSize} minSize={first.minSize}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel id={second.id} defaultSize={second.defaultSize} minSize={second.minSize}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
