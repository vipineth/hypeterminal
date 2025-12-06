import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MarketOverview } from "./market-overview";

export function TradeHome() {
	return (
		<ResizablePanelGroup direction="horizontal" className="w-full h-full min-h-screen">
			<ResizablePanel defaultSize={75}>
				<ResizablePanelGroup direction="vertical">
					<ResizablePanel defaultSize={60}>
						<div className="flex h-full flex-col">
							<MarketOverview />
							<span className="font-semibold">Chart</span>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={40}>
						<div className="flex h-full items-center justify-center p-6">
							<span className="font-semibold">Positions</span>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={25}>
				<div className="flex h-full items-center justify-center p-6">
					<span className="font-semibold">Content</span>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
