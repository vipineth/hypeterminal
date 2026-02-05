import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md cursor-pointer transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed [&>svg]:pointer-events-none [&>svg]:shrink-0",
	{
		variants: {
			variant: {
				contained: "w-full font-medium",
				outlined: "w-full border bg-transparent",
				text: "",
			},
			color: {
				default: "text-fg",
				accent: "text-accent-fg",
				danger: "text-danger",
			},
			size: {
				xl: "px-5 py-2.5 text-sm gap-2",
				lg: "px-4 py-2 text-sm gap-2",
				md: "px-4 py-1.5 text-sm gap-2",
				sm: "px-3 py-1 text-xs gap-1.5",
				none: "",
			},
		},
		compoundVariants: [
			{
				variant: "contained",
				color: "default",
				className: "bg-primary text-primary-fg hover:bg-primary/90 active:bg-primary/80",
			},
			{
				variant: "contained",
				color: "accent",
				className: "bg-accent text-accent-fg hover:bg-accent/90 active:bg-accent/80",
			},
			{
				variant: "contained",
				color: "danger",
				className: "bg-danger text-danger-fg hover:bg-danger/90 active:bg-danger/80",
			},

			{
				variant: "outlined",
				color: "default",
				className: "border-primary/40 hover:bg-primary/10 active:bg-primary/20",
			},
			{ variant: "outlined", color: "accent", className: "border-accent/40 hover:bg-accent/10 active:bg-accent/20" },
			{ variant: "outlined", color: "danger", className: "border-danger/40 hover:bg-danger/10 active:bg-danger/20" },

			{ variant: "text", className: "p-0.5 rounded-none" },
			{ variant: "text", color: "default", className: "hover:text-fg/80 active:text-fg/60" },
			{ variant: "text", color: "accent", className: "hover:text-accent-fg/80 active:text-accent-fg/60" },
			{ variant: "text", color: "danger", className: "hover:text-danger/80 active:text-danger/60" },
		],
		defaultVariants: {
			variant: "contained",
			color: "default",
			size: "md",
		},
	},
);

interface Props extends Omit<React.ComponentProps<"button">, "color">, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
}

function Button({ className, variant, color, size, asChild = false, startIcon, endIcon, children, ...props }: Props) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp data-slot="button" className={cn(buttonVariants({ variant, color, size, className }))} {...props}>
			{startIcon}
			<Slottable>{children}</Slottable>
			{endIcon}
		</Comp>
	);
}

export { Button, buttonVariants };
