"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

import { cn } from "@/lib/utils";

const ScrollArea = forwardRef<
	ElementRef<typeof ScrollAreaPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root ref={ref} data-slot="scroll-area" className={cn("relative", className)} {...props}>
		<ScrollAreaPrimitive.Viewport
			data-slot="scroll-area-viewport"
			className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
		>
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollBar />
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = forwardRef<
	ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
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
		<ScrollAreaPrimitive.ScrollAreaThumb
			data-slot="scroll-area-thumb"
			className="bg-border relative flex-1 rounded-full"
		/>
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
