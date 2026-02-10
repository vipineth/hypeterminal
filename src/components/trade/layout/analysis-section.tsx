import { useLayoutEffect } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { useConnection } from "wagmi";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PANEL_LAYOUT } from "@/config/constants";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

const { id, chart, positions } = PANEL_LAYOUT.ANALYSIS;

export function AnalysisSection() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });
	const { isConnected } = useConnection();
	const chartPanelRef = usePanelRef();
	const positionsPanelRef = usePanelRef();

	useLayoutEffect(() => {
		const chartSize = isConnected ? chart.defaultSize : chart.disconnectedSize;
		const positionsSize = isConnected ? positions.defaultSize : positions.disconnectedSize;
		chartPanelRef.current?.resize(`${chartSize}%`);
		positionsPanelRef.current?.resize(`${positionsSize}%`);
	}, [isConnected]);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup
				orientation="vertical"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel panelRef={chartPanelRef} defaultSize={chart.defaultSize} minSize={chart.minSize}>
					<MarketInfo />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel panelRef={positionsPanelRef} defaultSize={positions.defaultSize} minSize={positions.minSize}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
