import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentPanelSizes } from "@/hooks/trade/use-persistent-layout";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { OrderSidebar } from "./order-sidebar";

export function MainWorkspace() {
	const { sizes, onSizesChange } = usePersistentPanelSizes("CHART_WITH_SWAPBOX");

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onSizesChange}>
				<ResizablePanel defaultSize={sizes[0]}>
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
				<ResizablePanel defaultSize={sizes[1]}>
					<OrderSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
