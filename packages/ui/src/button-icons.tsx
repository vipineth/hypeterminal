import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const buttonIconVariants = cva(
	[
		"inline-flex items-center justify-center",
		"shrink-0 select-none cursor-pointer",
		"rounded-8",
		"transition-[color,background-color,border-color,opacity,scale] duration-150 ease-out",
		"active:not-data-disabled:scale-[0.97]",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			variant: {
				filled: "shadow-raised",
				outline: "border bg-transparent shadow-raised",
				ghost: "bg-transparent",
			},
			intent: {
				brand: "",
				neutral: "",
				error: "",
				inverse: "",
			},
			size: {
				xxs: "size-5 relative before:absolute before:-inset-2.5 before:content-['']",
				xs: "size-6 relative before:absolute before:-inset-2 before:content-['']",
				sm: "size-8 relative before:absolute before:-inset-1.5 before:content-['']",
				md: "size-10",
				lg: "size-12",
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
		],
		defaultVariants: {
			variant: "filled",
			intent: "brand",
			size: "sm",
		},
	},
);

interface ButtonIconProps
	extends React.ComponentPropsWithoutRef<typeof BaseButton>,
		VariantProps<typeof buttonIconVariants> {}

const ButtonIcon = React.forwardRef<HTMLButtonElement, ButtonIconProps>(
	({ className, variant, intent, size: sizeProp, children, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<BaseButton className={cn(buttonIconVariants({ variant, intent, size, className }))} ref={ref} {...props}>
				{children}
			</BaseButton>
		);
	},
);
ButtonIcon.displayName = "ButtonIcon";

export { ButtonIcon, buttonIconVariants };
export type { ButtonIconProps };
