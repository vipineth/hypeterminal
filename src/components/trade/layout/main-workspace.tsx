import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "../lib";
import { AnalysisSection } from "./analysis-section";
import { OrderSidebar } from "./order-sidebar";

export function MainWorkspace() {
	const { onLayout: onMainLayout } = usePersistentLayout("terminal:layout:main", [82, 18]);

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onMainLayout}>
				<ResizablePanel defaultSize={78}>
					<AnalysisSection />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={22}>
					<OrderSidebar />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

