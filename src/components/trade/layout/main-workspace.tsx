import { useCallback } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PANEL_LAYOUT } from "@/config/constants";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useMarketActions } from "@/stores/use-market-store";
import { TokenSelector } from "../chart/token-selector";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { TradeSidebar } from "./trade-sidebar";

const { id, analysis, sidebar } = PANEL_LAYOUT.MAIN;

export function MainWorkspace() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });
	const { data: selectedMarket } = useSelectedMarketInfo();
	const { setSelectedMarket } = useMarketActions();

	const handleMarketChange = useCallback(
		(marketName: string) => {
			setSelectedMarket(marketName);
		},
		[setSelectedMarket],
	);

	return (
		<div className="flex-1 min-h-0">
			<div className="flex items-center gap-2.5 border-b border-border/60 px-2 py-1.5">
				<TokenSelector selectedMarket={selectedMarket} onValueChange={handleMarketChange} />
				<div className="h-4 w-px bg-border/60 shrink-0" />
				<FavoritesStrip />
			</div>
			<ResizablePanelGroup className="h-full min-h-0" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
				<ResizablePanel defaultSize={analysis.defaultSize}>
					<div className="h-full flex flex-col">
						<div className="flex-1 min-h-0">
							<AnalysisSection />
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-status-info/30 data-[resize-handle-state=drag]:bg-status-info/50"
				/>
				<ResizablePanel defaultSize={sidebar.defaultSize}>
					<TradeSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
