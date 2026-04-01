import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const buttonVariants = cva(
	[
		"inline-flex items-center justify-center gap-2",
		"font-semibold select-none cursor-pointer",
		"rounded-8",
		"transition-[color,background-color,border-color,opacity,scale] duration-150 ease-out",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			variant: {
				filled: "shadow-raised active:not-data-disabled:scale-[0.97]",
				outline: "border bg-transparent shadow-raised active:not-data-disabled:scale-[0.97]",
				ghost: "bg-transparent active:not-data-disabled:scale-[0.97]",
				link: "bg-transparent underline underline-offset-4",
			},
			intent: {
				brand: "",
				neutral: "",
				error: "",
				inverse: "",
			},
			size: {
				xxs: "py-0.5 px-1.5 text-2xs gap-1",
				xs: "py-1 px-2 text-xs gap-1",
				sm: "py-1.5 px-3 text-xs gap-1.5",
				md: "py-2 px-4 text-sm",
				lg: "py-3 px-6 text-base",
			},
		},
		compoundVariants: [
			{
				variant: "filled",
				intent: "brand",
				className:
					"bg-fill-brand-strong text-text-inverse-strong hover:opacity-90 active:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "filled",
				intent: "neutral",
				className:
					"bg-fill-strong text-text-inverse-strong hover:opacity-90 active:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "filled",
				intent: "error",
				className:
					"bg-fill-error-strong text-text-inverse-strong hover:opacity-90 active:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "filled",
				intent: "inverse",
				className:
					"bg-fill-inverse-strong text-text-strong hover:opacity-90 active:opacity-80 data-disabled:opacity-40",
			},

			{
				variant: "outline",
				intent: "brand",
				className:
					"border-stroke-brand-strong text-text-brand hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40 data-disabled:border-stroke-disabled",
			},
			{
				variant: "outline",
				intent: "neutral",
				className:
					"border-stroke-weak text-text-strong hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40 data-disabled:border-stroke-disabled",
			},
			{
				variant: "outline",
				intent: "error",
				className:
					"border-stroke-error-strong text-text-error hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40 data-disabled:border-stroke-disabled",
			},
			{
				variant: "outline",
				intent: "inverse",
				className:
					"border-stroke-inverse-strong text-text-inverse-strong hover:bg-fill-inverse-hover active:bg-fill-inverse-press data-disabled:opacity-40 data-disabled:border-stroke-inverse-disabled",
			},

			{
				variant: "ghost",
				intent: "brand",
				className: "text-text-brand hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40",
			},
			{
				variant: "ghost",
				intent: "neutral",
				className: "text-text-strong hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40",
			},
			{
				variant: "ghost",
				intent: "error",
				className: "text-text-error hover:bg-fill-hover active:bg-fill-press data-disabled:opacity-40",
			},
			{
				variant: "ghost",
				intent: "inverse",
				className:
					"text-text-inverse-strong hover:bg-fill-inverse-hover active:bg-fill-inverse-press data-disabled:opacity-40",
			},

			{
				variant: "link",
				intent: "brand",
				className: "text-text-brand hover:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "link",
				intent: "neutral",
				className: "text-text-strong hover:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "link",
				intent: "error",
				className: "text-text-error hover:opacity-80 data-disabled:opacity-40",
			},
			{
				variant: "link",
				intent: "inverse",
				className: "text-text-inverse-strong hover:opacity-80 data-disabled:opacity-40",
			},
		],
		defaultVariants: {
			variant: "filled",
			intent: "brand",
			size: "sm",
		},
	},
);

const iconPaddingLeft: Record<string, string> = {
	xxs: "pl-1",
	xs: "pl-1.5",
	sm: "pl-2.5",
	md: "pl-3.5",
	lg: "pl-5.5",
};

const iconPaddingRight: Record<string, string> = {
	xxs: "pr-1",
	xs: "pr-1.5",
	sm: "pr-2.5",
	md: "pr-3.5",
	lg: "pr-5.5",
};

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton>, VariantProps<typeof buttonVariants> {
	iconLeft?: React.ReactNode;
	iconRight?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, intent, size: sizeProp, iconLeft, iconRight, children, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<BaseButton
				className={cn(
					buttonVariants({ variant, intent, size, className }),
					iconLeft && iconPaddingLeft[size],
					iconRight && iconPaddingRight[size],
				)}
				ref={ref}
				{...props}
			>
				{iconLeft}
				{children}
				{iconRight}
			</BaseButton>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
