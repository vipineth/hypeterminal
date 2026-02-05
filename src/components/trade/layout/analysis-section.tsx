import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

export function AnalysisSection() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: "CHART_WITH_POSITIONS" });

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation="vertical"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel defaultSize={52} minSize={30}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={48} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
