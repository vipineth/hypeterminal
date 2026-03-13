import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PANEL_LAYOUT } from "@/config/constants";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { TokenSelector } from "../chart/token-selector";
import { FavoritesStrip } from "../header/favorites-strip";
import { AnalysisSection } from "./analysis-section";
import { TradeSidebar } from "./trade-sidebar";

const { id, analysis, sidebar } = PANEL_LAYOUT.MAIN;

export function MainWorkspace() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });
	const { data: selectedMarket } = useSelectedMarketInfo();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();

	function handleMarketChange(marketName: string) {
		setSelectedMarket(scope, marketName);
	}

	return (
		<div className="flex-1 min-h-0">
			<div className="flex items-center gap-3 border-b border-border-100/80 bg-surface-base/72 px-3 py-2 backdrop-blur-xl">
				<TokenSelector selectedMarket={selectedMarket} onValueChange={handleMarketChange} />
				<div className="h-5 w-px shrink-0 bg-border-100/80" />
				<FavoritesStrip />
			</div>
			<ResizablePanelGroup className="h-full min-h-0" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
				<ResizablePanel defaultSize={analysis.defaultSize}>
					<div className="flex h-full flex-col bg-surface-analysis">
						<div className="flex-1 min-h-0">
							<AnalysisSection />
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border-100/70 data-[resize-handle-state=hover]:bg-border-300 data-[resize-handle-state=drag]:bg-primary-default/35"
				/>
				<ResizablePanel defaultSize={sidebar.defaultSize}>
					<TradeSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
