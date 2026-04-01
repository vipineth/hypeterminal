import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const tagVariants = cva(
	[
		"inline-flex items-center font-normal select-none",
		"border rounded-16",
		"transition-colors duration-150",
		"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			variant: {
				filled: "bg-fill-weak border-stroke-weak text-text-strong",
				outline: "bg-transparent border-stroke-weak text-text-strong",
			},
			size: {
				xxs: "py-0 px-1.5 gap-1 text-2xs",
				xs: "py-px px-2 gap-1 text-xs",
				sm: "py-0.5 px-3 gap-1.5 text-xs",
				md: "py-1 px-4 gap-2 text-sm",
				lg: "py-1.5 px-6 gap-2 text-base",
			},
		},
		defaultVariants: {
			variant: "filled",
			size: "sm",
		},
	},
);

const iconSizes: Record<string, number> = {
	xxs: 10,
	xs: 12,
	sm: 12,
	md: 16,
	lg: 20,
};

interface TagProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof tagVariants> {
	selected?: boolean;
	disabled?: boolean;
	onDismiss?: () => void;
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
	({ className, variant, size: sizeProp, selected, disabled, onDismiss, children, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const iconSize = iconSizes[size ?? "md"];

		return (
			<span
				className={cn(
					tagVariants({ variant, size }),
					selected && "bg-fill-selected border-transparent text-text-inverse-strong",
					className,
				)}
				ref={ref}
				data-disabled={disabled ? "" : undefined}
				{...props}
			>
				{selected && <CheckIcon size={iconSize} weight="bold" />}
				{children}
				{onDismiss && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							if (!disabled) onDismiss();
						}}
						className={cn(
							"relative inline-flex items-center justify-center shrink-0",
							"text-current opacity-70 hover:opacity-100 transition-opacity",
							"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-8",
							disabled && "pointer-events-none",
						)}
						aria-label="Remove"
						tabIndex={disabled ? -1 : 0}
					>
						<XIcon size={iconSize} weight="bold" />
					</button>
				)}
			</span>
		);
	},
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
export type { TagProps };
