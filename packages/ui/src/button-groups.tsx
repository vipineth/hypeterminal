import { Toolbar } from "@base-ui/react/toolbar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

type ButtonGroupSize = "xxs" | "xs" | "sm" | "md" | "lg";
type ButtonGroupVariant = "outline" | "filled" | "ghost";
type ButtonGroupIntent = "brand" | "neutral" | "error";

const ButtonGroupContext = React.createContext<{
	size: ButtonGroupSize;
	variant: ButtonGroupVariant;
	intent: ButtonGroupIntent;
}>({
	size: "sm",
	variant: "outline",
	intent: "neutral",
});

const buttonGroupVariants = cva(
	[
		"inline-flex items-stretch",
		"[&>*:first-child]:rounded-l-8 [&>*:first-child]:rounded-r-none",
		"[&>*:last-child]:rounded-r-8 [&>*:last-child]:rounded-l-none",
		"[&>*:not(:first-child):not(:last-child)]:rounded-none",
		"[&>*:only-child]:rounded-8",
	],
	{
		variants: {
			variant: {
				outline: "shadow-raised [&>*+*]:-ml-px",
				filled: "shadow-raised",
				ghost: "",
			},
		},
		defaultVariants: {
			variant: "outline",
		},
	},
);

const buttonGroupItemVariants = cva(
	[
		"inline-flex items-center justify-center",
		"font-semibold select-none cursor-pointer",
		"relative",
		"transition-colors duration-150",
		"focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:cursor-not-allowed data-disabled:opacity-40",
	],
	{
		variants: {
			variant: {
				outline: "border bg-transparent",
				filled: "",
				ghost: "bg-transparent",
			},
			intent: {
				brand: "",
				neutral: "",
				error: "",
			},
			size: {
				xxs: "py-0.5 px-1.5 text-2xs gap-1",
				xs: "py-1 px-2 text-xs gap-1",
				sm: "py-1.5 px-3 text-xs gap-1.5",
				md: "py-2 px-4 text-sm gap-2",
				lg: "py-3 px-6 text-base gap-2",
			},
		},
		compoundVariants: [
			{
				variant: "outline",
				intent: "brand",
				className: "border-stroke-brand-strong text-text-brand hover:bg-fill-hover active:bg-fill-press",
			},
			{
				variant: "outline",
				intent: "neutral",
				className: "border-stroke-weak text-text-strong hover:bg-fill-hover active:bg-fill-press",
			},
			{
				variant: "outline",
				intent: "error",
				className: "border-stroke-error-strong text-text-error hover:bg-fill-hover active:bg-fill-press",
			},
			{
				variant: "filled",
				intent: "brand",
				className: "bg-fill-brand-strong text-text-inverse-strong hover:opacity-90 active:opacity-80",
			},
			{
				variant: "filled",
				intent: "neutral",
				className: "bg-fill-strong text-text-inverse-strong hover:opacity-90 active:opacity-80",
			},
			{
				variant: "filled",
				intent: "error",
				className: "bg-fill-error-strong text-text-inverse-strong hover:opacity-90 active:opacity-80",
			},
			{
				variant: "ghost",
				intent: "brand",
				className: "text-text-brand hover:bg-fill-hover active:bg-fill-press",
			},
			{
				variant: "ghost",
				intent: "neutral",
				className: "text-text-strong hover:bg-fill-hover active:bg-fill-press",
			},
			{
				variant: "ghost",
				intent: "error",
				className: "text-text-error hover:bg-fill-hover active:bg-fill-press",
			},
		],
		defaultVariants: {
			variant: "outline",
			intent: "neutral",
			size: "sm",
		},
	},
);

interface ButtonGroupProps extends VariantProps<typeof buttonGroupVariants> {
	size?: ButtonGroupSize;
	intent?: ButtonGroupIntent;
	disabled?: boolean;
	className?: string;
	children: React.ReactNode;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
	({ className, variant = "outline", size: sizeProp, intent = "neutral", disabled, children, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<ButtonGroupContext.Provider value={{ size, variant: variant ?? "outline", intent }}>
				<Toolbar.Root
					ref={ref}
					disabled={disabled}
					className={cn(buttonGroupVariants({ variant, className }))}
					{...props}
				>
					{children}
				</Toolbar.Root>
			</ButtonGroupContext.Provider>
		);
	},
);
ButtonGroup.displayName = "ButtonGroup";

interface ButtonGroupItemProps extends Omit<React.ComponentPropsWithoutRef<typeof Toolbar.Button>, "className"> {
	className?: string;
	iconLeft?: React.ReactNode;
	iconRight?: React.ReactNode;
}

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
	({ className, iconLeft, iconRight, children, ...props }, ref) => {
		const { size, variant, intent } = React.useContext(ButtonGroupContext);

		return (
			<Toolbar.Button
				ref={ref}
				className={cn(buttonGroupItemVariants({ variant, intent, size, className }))}
				{...props}
			>
				{iconLeft}
				{children}
				{iconRight}
			</Toolbar.Button>
		);
	},
);
ButtonGroupItem.displayName = "ButtonGroupItem";

export { ButtonGroup, ButtonGroupItem, buttonGroupVariants, buttonGroupItemVariants };
export type { ButtonGroupProps, ButtonGroupItemProps };
