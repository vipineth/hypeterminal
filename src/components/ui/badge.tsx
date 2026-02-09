import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 focus-visible:ring-[3px] aria-invalid:ring-error-700/20 dark:aria-invalid:ring-error-700/40 aria-invalid:border-error-700 transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary-default text-white [a&]:hover:bg-primary-hover",
				secondary: "border-transparent bg-surface-base text-text-800 [a&]:hover:bg-surface-base/90",
				destructive:
					"border-transparent bg-error-700 text-white [a&]:hover:bg-error-700/90 focus-visible:ring-error-700/20 dark:focus-visible:ring-error-700/40 dark:bg-error-700/60",
				outline: "text-text-950 [a&]:hover:bg-surface-analysis [a&]:hover:text-text-950",
				// Trading variants
				long: "border-market-up-600/40 bg-market-up-100 text-market-up-600",
				short: "border-market-down-600/40 bg-market-down-100 text-market-down-600",
				neutral: "border-border-200/60 bg-surface-analysis text-text-800",
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
