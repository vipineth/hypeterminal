import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/cn";

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
	return (
		<ResizablePrimitive.Group data-slot="resizable-panel-group" className={cn("h-full w-full", className)} {...props} />
	);
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
	return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: ResizablePrimitive.SeparatorProps & {
	withHandle?: boolean;
}) {
	return (
		<ResizablePrimitive.Separator
			data-slot="resizable-handle"
			className={cn(
				"bg-border relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
				className,
			)}
			{...props}
		>
			{withHandle && (
				<div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
					<DotsSixVerticalIcon className="size-2.5" />
				</div>
			)}
		</ResizablePrimitive.Separator>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
