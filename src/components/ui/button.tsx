import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-fg hover:bg-primary/90 rounded-md font-medium",
				destructive: "bg-danger text-danger-fg hover:bg-danger/90 rounded-md font-medium",
				outline: "border border-border/60 bg-bg hover:bg-accent hover:text-accent-fg rounded-md",
				ghost: "hover:bg-accent",
				terminal: "border border-info/40 hover:bg-info/40",
				danger: "border border-border/60 hover:border-negative/60 hover:text-negative",
				link: "hover:underline hover:text-info",
			},
			size: {
				default: "h-9 px-4 py-2 text-sm gap-2 rounded-md",
				lg: "h-10 px-6 text-sm gap-2 rounded-md",
				sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
				xs: "px-1.5 py-0.5 text-4xs gap-0.5 rounded-sm uppercase tracking-wider",
				none: "",
				icon: "size-9 rounded-md",
				"icon-sm": "size-8 rounded-md",
				"icon-lg": "size-10 rounded-md",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface Props extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: Props) {
	const Comp = asChild ? Slot : "button";

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
