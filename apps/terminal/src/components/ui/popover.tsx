import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";
import { cn } from "@/lib/cn";

const POPOVER_DEFAULT_SIDE_OFFSET = 4;
const POPOVER_DEFAULT_COLLISION_PADDING = 8;
const POPOVER_DEFAULT_WIDTH_CLASS = "w-72";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

type PopoverTriggerProps = React.ComponentProps<typeof PopoverPrimitive.Trigger> & {
	asChild?: boolean;
};

function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
	if (asChild && React.isValidElement(children)) {
		return <PopoverPrimitive.Trigger data-slot="popover-trigger" render={children} {...props} />;
	}

	return (
		<PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
			{children}
		</PopoverPrimitive.Trigger>
	);
}

function PopoverContent({
	className,
	align = "center",
	sideOffset = POPOVER_DEFAULT_SIDE_OFFSET,
	alignOffset = 0,
	collisionPadding = POPOVER_DEFAULT_COLLISION_PADDING,
	collisionAvoidance,
	keepMounted = false,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
	align?: "start" | "center" | "end";
	sideOffset?: number;
	alignOffset?: number;
	collisionPadding?: number;
	collisionAvoidance?: React.ComponentProps<typeof PopoverPrimitive.Positioner>["collisionAvoidance"];
	keepMounted?: boolean;
}) {
	return (
		<PopoverPrimitive.Portal keepMounted={keepMounted}>
			<PopoverPrimitive.Positioner
				align={align}
				sideOffset={sideOffset}
				alignOffset={alignOffset}
				collisionPadding={collisionPadding}
				collisionAvoidance={collisionAvoidance}
				className="z-50"
			>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"font-sans bg-surface text-fg z-50 rounded-12 border border-stroke-weak p-4 shadow-overlay outline-hidden",
						POPOVER_DEFAULT_WIDTH_CLASS,
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

export { Popover, PopoverContent, PopoverTrigger };
