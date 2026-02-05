import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PANEL_LAYOUT } from "@/config/constants";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { TradeSidebar } from "./trade-sidebar";

const { id, analysis, sidebar } = PANEL_LAYOUT.MAIN;

export function MainWorkspace() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup className="h-full min-h-0" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
				<ResizablePanel defaultSize={analysis.defaultSize}>
					<div className="h-full flex flex-col">
						<FavoritesStrip />
						<div className="flex-1 min-h-0">
							<AnalysisSection />
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50"
				/>
				<ResizablePanel defaultSize={sidebar.defaultSize}>
					<TradeSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
