import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-8 transition outline-none focus-visible:ring-2 focus-visible:ring-primary-default/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				contained: "shadow-raised",
				outlined: "border bg-transparent",
				ghost: "",
				text: "p-0",
				destructive:
					"bg-fill-error-strong text-white shadow-raised hover:bg-fill-error-strong/90 active:bg-fill-error-strong/80",
			},
			size: {
				none: "",
				sm: "p-1 gap-1 text-xs",
				md: "p-1 gap-1 text-xs",
				lg: "p-1.5 gap-1.5 text-sm font-medium",
				icon: "size-7 p-0",
			},
			tone: {
				base: "",
				accent: "",
			},
		},
		compoundVariants: [
			{
				variant: "contained",
				tone: "base",
				class: "bg-text-950 text-text-inverse-strong hover:bg-text-950/90 active:bg-text-950/80",
			},
			{
				variant: "contained",
				tone: "accent",
				class: "bg-fill-brand-strong text-white hover:bg-primary-hover active:bg-primary-active",
			},
			{
				variant: "outlined",
				tone: "base",
				class:
					"border-stroke-strong text-text-strong hover:border-text-disabled hover:bg-text-950/5 active:bg-text-950/10",
			},
			{
				variant: "outlined",
				tone: "accent",
				class:
					"border-primary-default text-text-brand hover:border-primary-hover hover:bg-fill-brand-strong/5 active:bg-fill-brand-strong/10",
			},
			{
				variant: "ghost",
				tone: "base",
				class:
					"text-text-weak hover:bg-text-950/5 hover:text-text-strong active:bg-text-950/10 active:text-text-strong",
			},
			{
				variant: "ghost",
				tone: "accent",
				class:
					"text-text-brand hover:bg-fill-brand-strong/5 hover:text-primary-hover active:bg-fill-brand-strong/10 active:text-primary-active",
			},
			{ variant: "text", tone: "base", class: "text-text-weak hover:text-text-strong active:text-text-strong" },
			{
				variant: "text",
				tone: "accent",
				class: "text-text-brand hover:text-primary-hover active:text-primary-active",
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
