import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const textLinkVariants = cva(
	[
		"inline-flex items-center cursor-pointer",
		"transition-opacity duration-150",
		"rounded-4",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"hover:opacity-80",
		"data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:pointer-events-none",
	],
	{
		variants: {
			size: {
				xxs: "text-2xs gap-0.5",
				xs: "text-xs gap-0.5",
				sm: "text-xs gap-1",
				md: "text-sm gap-1.5",
				lg: "text-base gap-2",
			},
			weight: {
				regular: "font-normal",
				strong: "font-semibold",
			},
			intent: {
				brand: "text-text-brand",
				neutral: "text-text-strong",
				error: "text-text-error",
			},
			underline: {
				true: "underline underline-offset-4",
				false: "",
			},
		},
		defaultVariants: {
			size: "sm",
			weight: "regular",
			intent: "brand",
			underline: false,
		},
	},
);

interface TextLinkProps extends React.ComponentPropsWithoutRef<"a">, VariantProps<typeof textLinkVariants> {
	disabled?: boolean;
	iconLeft?: React.ReactNode;
	iconRight?: React.ReactNode;
}

const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
	(
		{ className, size: sizeProp, weight, intent, underline, disabled, iconLeft, iconRight, children, ...props },
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<a
				className={cn(textLinkVariants({ size, weight, intent, underline, className }))}
				ref={ref}
				data-disabled={disabled ? "" : undefined}
				aria-disabled={disabled || undefined}
				tabIndex={disabled ? -1 : undefined}
				{...props}
			>
				{iconLeft}
				{children}
				{iconRight}
			</a>
		);
	},
);
TextLink.displayName = "TextLink";

export { TextLink, textLinkVariants };
export type { TextLinkProps };
