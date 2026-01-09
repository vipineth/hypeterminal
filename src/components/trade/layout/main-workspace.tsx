import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PERSISTENCE } from "@/config/interface";
import { FavoritesStrip } from "../header/favorites-strip";
import { usePersistentLayout } from "../hooks/use-persistent-layout";
import { AnalysisSection } from "./analysis-section";
import { OrderSidebar } from "./order-sidebar";

export function MainWorkspace() {
	const layout = LAYOUT_PERSISTENCE.MAIN;
	const { onLayout: onMainLayout } = usePersistentLayout(layout.KEY, layout.FALLBACK);

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onMainLayout}>
				<ResizablePanel defaultSize={layout.PANEL_DEFAULTS[0]}>
					<FavoritesStrip />
					<AnalysisSection />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={layout.PANEL_DEFAULTS[1]}>
					<OrderSidebar />{" "}
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
