import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "@/hooks/trade/use-persistent-layout";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { TradeSidebar } from "./trade-sidebar";

export function MainWorkspace() {
	const { config, defaultLayout, onLayoutChanged } = usePersistentLayout("CHART_WITH_SWAPBOX");
	const [first, second] = config.panels;

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup
				orientation={config.orientation}
				className="h-full min-h-0"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel id={first.id} defaultSize={first.defaultSize} minSize={first.minSize}>
					<div className="h-full flex flex-col">
						<FavoritesStrip />
						<div className="flex-1 min-h-0">
							<AnalysisSection />
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle className="w-px bg-border/40" />
				<ResizablePanel
					id={second.id}
					defaultSize={second.defaultSize}
					minSize={second.minSize}
					maxSize={second.maxSize}
				>
					<TradeSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
