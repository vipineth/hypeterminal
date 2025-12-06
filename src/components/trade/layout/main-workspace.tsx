import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { usePersistentLayout } from "../lib";
import { LeftSection } from "./left-section";
import { RightColumn } from "./right-column";

export function MainWorkspace() {
	const { onLayout: onMainLayout } = usePersistentLayout("terminal:layout:main", [82, 18]);

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onMainLayout}>
				<ResizablePanel defaultSize={78}>
					<LeftSection />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={22}>
					<RightColumn />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

