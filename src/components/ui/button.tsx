import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				contained: "shadow-xs",
				outlined: "border bg-transparent",
				ghost: "",
				text: "p-0",
				destructive: "bg-status-error text-white shadow-xs hover:bg-status-error/90 active:bg-status-error/80",
			},
			size: {
				none: "",
				sm: "h-6 px-1.5 gap-1 text-2xs",
				md: "h-7 px-2 gap-1 text-xs font-medium",
				lg: "h-8 px-3 gap-1.5 text-sm font-medium",
				icon: "size-7 p-0",
			},
			tone: {
				base: "",
				accent: "",
			},
		},
		compoundVariants: [
			{ variant: "contained", tone: "base", class: "bg-fg-900 text-surface-200 hover:bg-fg-800 active:bg-fg-700" },
			{
				variant: "contained",
				tone: "accent",
				class: "bg-action-primary text-white hover:bg-action-primary-hover active:bg-action-primary-active",
			},
			{
				variant: "outlined",
				tone: "base",
				class: "border-border text-fg-800 hover:border-fg-400 hover:bg-fg-900/5 active:bg-fg-900/10",
			},
			{
				variant: "outlined",
				tone: "accent",
				class:
					"border-action-primary text-action-primary hover:border-action-primary-hover hover:bg-action-primary/5 active:bg-action-primary/10",
			},
			{
				variant: "ghost",
				tone: "base",
				class: "text-fg-700 hover:bg-fg-900/5 hover:text-fg-800 active:bg-fg-900/10 active:text-fg-900",
			},
			{
				variant: "ghost",
				tone: "accent",
				class:
					"text-action-primary hover:bg-action-primary/5 hover:text-action-primary-hover active:bg-action-primary/10 active:text-action-primary-active",
			},
			{ variant: "text", tone: "base", class: "text-fg-700 hover:text-fg-800 active:text-fg-900" },
			{
				variant: "text",
				tone: "accent",
				class: "text-action-primary hover:text-action-primary-hover active:text-action-primary-active",
			},
		],
		defaultVariants: {
			variant: "contained",
			size: "md",
			tone: "base",
		},
	},
);

interface Props extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({ className, variant, size, tone, asChild = false, ...props }: Props) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, tone, className }))} {...props} />;
}

export { Button, buttonVariants };
