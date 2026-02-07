import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-status-error/20 dark:aria-invalid:ring-status-error/40 aria-invalid:border-status-error transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				default: "border-transparent bg-action-primary text-white [a&]:hover:bg-action-primary-hover",
				secondary: "border-transparent bg-surface-200 text-fg-700 [a&]:hover:bg-surface-200/90",
				destructive:
					"border-transparent bg-status-error text-white [a&]:hover:bg-status-error/90 focus-visible:ring-status-error/20 dark:focus-visible:ring-status-error/40 dark:bg-status-error/60",
				outline: "text-fg-900 [a&]:hover:bg-surface-500 [a&]:hover:text-fg-900",
				// Trading variants
				long: "border-market-up-primary/40 bg-market-up-subtle text-market-up-primary",
				short: "border-market-down-primary/40 bg-market-down-subtle text-market-down-primary",
				neutral: "border-border/60 bg-surface-alt/30 text-fg-700",
			},
			size: {
				default: "px-2 py-0.5 text-xs font-medium gap-1 [&>svg]:size-3",
				sm: "px-1.5 py-0 text-2xs font-medium gap-0.5 [&>svg]:size-2.5",
				xs: "px-1 py-0 text-3xs font-medium gap-0.5 [&>svg]:size-2",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Badge({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? SlotPrimitive.Slot : "span";

	return <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
