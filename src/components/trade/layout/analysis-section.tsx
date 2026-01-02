import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PERSISTENCE } from "@/constants/app";
import { usePersistentLayout } from "../hooks/use-persistent-layout";
import { PositionsPanel } from "../positions/positions-panel";
import { PriceRow } from "./price-row";

export function AnalysisSection() {
	const layout = LAYOUT_PERSISTENCE.VERTICAL;
	const { layout: vertLayout, onLayout: onVertLayout } = usePersistentLayout(layout.KEY, layout.FALLBACK);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="vertical" className="h-full min-h-0" onLayout={onVertLayout}>
				<ResizablePanel defaultSize={vertLayout[0] ?? layout.PANEL_DEFAULTS[0]} minSize={30}>
					<PriceRow />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={vertLayout[1] ?? layout.PANEL_DEFAULTS[1]} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
