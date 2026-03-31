import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";
import { cn } from "@/lib/cn";

const ScrollArea = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>>(
	({ className, children, ...props }, ref) => (
		<ScrollAreaPrimitive.Root ref={ref} data-slot="scroll-area" className={cn("relative", className)} {...props}>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className="size-full rounded-[inherit] outline-none"
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	),
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar = forwardRef<
	ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
	ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.Scrollbar
		ref={ref}
		data-slot="scroll-area-scrollbar"
		orientation={orientation}
		className={cn(
			"flex touch-none p-px transition-colors select-none",
			orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
			orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
			className,
		)}
		{...props}
	>
		<ScrollAreaPrimitive.Thumb data-slot="scroll-area-thumb" className="bg-stroke-weak relative flex-1 rounded-full" />
	</ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
