import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-danger/20 dark:aria-invalid:ring-danger/40 aria-invalid:border-danger transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary text-primary-fg [a&]:hover:bg-primary/90",
				secondary: "border-transparent bg-secondary text-secondary-fg [a&]:hover:bg-secondary/90",
				destructive:
					"border-transparent bg-danger text-danger-fg [a&]:hover:bg-danger/90 focus-visible:ring-danger/20 dark:focus-visible:ring-danger/40 dark:bg-danger/60",
				outline: "text-fg [a&]:hover:bg-accent [a&]:hover:text-accent-fg",
				// Trading variants
				long: "border-positive/40 bg-positive/10 text-positive",
				short: "border-negative/40 bg-negative/10 text-negative",
				neutral: "border-border/60 bg-muted/30 text-muted-fg",
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
