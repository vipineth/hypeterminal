import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const slotVariants = cva(
	[
		"flex items-center justify-center",
		"border border-dashed border-stroke-weak",
		"rounded-8",
		"bg-bg-sunken",
		"text-xs text-text-weak",
	],
	{
		variants: {
			size: {
				xxs: "h-5 px-1.5",
				xs: "h-6 px-2",
				sm: "h-8 px-3",
				md: "h-10 px-4",
				lg: "h-12 px-6",
				xl: "h-16 px-6",
				fill: "min-h-10 p-4",
			},
		},
		defaultVariants: {
			size: "md",
		},
	},
);

interface SlotProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof slotVariants> {}

const Slot = React.forwardRef<HTMLDivElement, SlotProps>(({ className, size, children, ...props }, ref) => (
	<div className={cn(slotVariants({ size, className }))} ref={ref} {...props}>
		{children}
	</div>
));
Slot.displayName = "Slot";

export { Slot, slotVariants };
export type { SlotProps };
