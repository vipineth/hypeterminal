import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PANEL_LAYOUT } from "@/config/constants";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

const { id, chart, positions } = PANEL_LAYOUT.ANALYSIS;

export function AnalysisSection() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation="vertical"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel defaultSize={chart.defaultSize} minSize={chart.minSize}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={positions.defaultSize} minSize={positions.minSize}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
