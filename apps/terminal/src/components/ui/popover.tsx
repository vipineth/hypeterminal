import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type * as React from "react";
import { cn } from "@/lib/cn";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	align = "center",
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
	align?: "start" | "center" | "end";
	sideOffset?: number;
}) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner align={align} sideOffset={sideOffset}>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"font-sans bg-bg-overlay text-text-strong z-50 w-72 rounded-12 border border-stroke-weak p-4 shadow-overlay outline-hidden",
						"transition-[opacity,transform] duration-150 ease-out origin-(--transform-origin)",
						"data-starting-style:opacity-0 data-starting-style:scale-95",
						"data-ending-style:opacity-0 data-ending-style:scale-95",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
	return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
