import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

const toggleVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-surface-300 hover:text-fg-700 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-surface-500 data-[state=on]:text-fg-900 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-status-error/20 dark:aria-invalid:ring-status-error/40 aria-invalid:border-status-error whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border border-border bg-transparent shadow-xs hover:bg-surface-500 hover:text-fg-900",
			},
			size: {
				default: "h-9 px-2 min-w-9",
				sm: "h-8 px-1.5 min-w-8",
				lg: "h-10 px-2.5 min-w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Toggle({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant, size, className }))} {...props} />
	);
}

export { Toggle, toggleVariants };
