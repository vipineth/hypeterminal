import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { TradeSidebar } from "./trade-sidebar";

export function MainWorkspace() {
	const { defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_SWAPBOX");

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup
				orientation="horizontal"
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel defaultSize="76" minSize="500px">
					<div className="h-full flex flex-col">
						<FavoritesStrip />
						<div className="flex-1 min-h-0">
							<AnalysisSection />
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle className="w-px bg-border/40 hover:bg-info/30 active:bg-info/50" />
				<ResizablePanel defaultSize="24" minSize="280px" maxSize="440px">
					<TradeSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
