import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const textVariants = cva("", {
	variants: {
		variant: {
			display: "text-3xl font-semibold text-balance",
			h1: "text-2xl font-semibold text-balance",
			h2: "text-xl font-semibold text-balance",
			h3: "text-lg font-semibold text-balance",
			h4: "text-base font-semibold text-balance",
			small: "text-sm font-normal text-pretty",
			tiny: "text-xs font-normal text-pretty",
			uppercase: "text-xs font-semibold uppercase tracking-wider",
		},
		color: {
			strong: "text-text-strong",
			weak: "text-text-weak",
			brand: "text-text-brand",
			disabled: "text-text-disabled",
			error: "text-text-error",
			warning: "text-text-warning",
			success: "text-text-success",
			info: "text-text-info",
			"inverse-strong": "text-text-inverse-strong",
			"inverse-weak": "text-text-inverse-weak",
		},
		weight: {
			strong: "font-semibold",
			weak: "font-normal",
		},
	},
	defaultVariants: {
		variant: "small",
	},
});

const defaultElementMap: Record<string, React.ElementType> = {
	display: "h1",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	h4: "h4",
	small: "p",
	tiny: "p",
	uppercase: "p",
};

interface TextProps extends Omit<React.HTMLAttributes<HTMLElement>, "color">, VariantProps<typeof textVariants> {
	as?: React.ElementType;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
	({ className, variant = "small", color, weight, as, ...props }, ref) => {
		const Element = as || defaultElementMap[variant || "small"] || "p";
		const resolvedColor = color ?? (variant === "uppercase" ? "weak" : "strong");

		return (
			<Element
				className={cn(textVariants({ variant, color: resolvedColor, weight, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Text.displayName = "Text";

export { Text, textVariants };
export type { TextProps };
