import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "../lib";
import { PositionsPanel } from "../positions/positions-panel";
import { PriceRow } from "./price-row";

export function AnalysisSection() {
	const { layout: vertLayout, onLayout: onVertLayout } = usePersistentLayout("terminal:layout:vert", [70, 30]);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="vertical" className="h-full min-h-0" onLayout={onVertLayout}>
				<ResizablePanel defaultSize={vertLayout[0] ?? 65} minSize={30}>
					<PriceRow />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={vertLayout[1] ?? 35} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
