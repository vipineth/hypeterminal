import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LAYOUT_PRESETS, usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { OrderSidebar } from "./order-sidebar";

export function MainWorkspace() {
	const layoutPreset = LAYOUT_PRESETS.MAIN_WORKSPACE;
	const { handleLayoutChange } = usePersistentLayout(layoutPreset.storageKey, layoutPreset.fallbackSizes);

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={handleLayoutChange}>
				<ResizablePanel defaultSize={layoutPreset.defaultSizes[0]}>
					<FavoritesStrip />
					<AnalysisSection />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-info/30 data-[resize-handle-state=drag]:bg-info/50"
				/>
				<ResizablePanel defaultSize={layoutPreset.defaultSizes[1]}>
					<OrderSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
