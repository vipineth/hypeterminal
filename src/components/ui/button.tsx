import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				contained: "bg-primary text-primary-fg hover:bg-primary/90 px-2 py-1 gap-1 rounded-xs",
				outlined: "border border-primary/60 text-primary bg-transparent hover:bg-primary/10 px-2 py-1 gap-1 rounded-xs",
				text: "text-primary hover:text-primary/70 p-0.5 gap-1",
			},
			size: {
				sm: "text-2xs",
				md: "text-xs font-medium",
				lg: "text-sm font-medium",
				none: "",
			},
		},
		defaultVariants: {
			variant: "contained",
			size: "md",
		},
	},
);

interface Props extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: Props) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
