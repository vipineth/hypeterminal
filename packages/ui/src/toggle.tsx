import { Switch } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const toggleVariants = cva(
	[
		"relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
		"transition-colors duration-150 motion-reduce:transition-none",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-unchecked:bg-fill-weak",
		"data-unchecked:ring-1 data-unchecked:ring-inset data-unchecked:ring-stroke-strong",
		"data-unchecked:inset-shadow-sunken",
		"data-checked:bg-fill-selected",
		"data-checked:hover:opacity-90 data-checked:active:opacity-80",
		"data-disabled:cursor-not-allowed data-disabled:opacity-40",
		"before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-1/2 before:min-w-11 before:min-h-11",
	],
	{
		variants: {
			size: {
				xxs: "h-4 w-8",
				xs: "h-5 w-10",
				sm: "h-6 w-12",
				md: "h-8 w-16",
				lg: "h-10 w-20",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

const labelTextSizeClasses: Record<"xxs" | "xs" | "sm" | "md" | "lg", string> = {
	xxs: "text-xs",
	xs: "text-xs",
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

const thumbVariants = cva(
	[
		"pointer-events-none block rounded-full bg-surface shadow-raised",
		"border-2 data-unchecked:border-stroke-strong data-checked:border-stroke-selected",
		"transition-transform duration-150 motion-reduce:transition-none",
	],
	{
		variants: {
			size: {
				xxs: "size-4 data-checked:translate-x-4",
				xs: "size-5 data-checked:translate-x-5",
				sm: "size-6 data-checked:translate-x-6",
				md: "size-8 data-checked:translate-x-8",
				lg: "size-10 data-checked:translate-x-10",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

interface ToggleProps
	extends Omit<React.ComponentPropsWithoutRef<typeof Switch.Root>, "className">,
		VariantProps<typeof toggleVariants> {
	className?: string;
	label?: React.ReactNode;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
	({ className, size: sizeProp, label, disabled, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		const track = (
			<Switch.Root
				ref={ref}
				disabled={disabled}
				className={cn(toggleVariants({ size }), !label && className)}
				{...props}
			>
				<Switch.Thumb className={cn(thumbVariants({ size }))} />
			</Switch.Root>
		);

		if (!label) return track;

		return (
			<label
				className={cn(
					"inline-flex items-center gap-3 select-none",
					disabled ? "cursor-not-allowed" : "cursor-pointer",
					className,
				)}
			>
				{track}
				<span className={cn("font-normal", labelTextSizeClasses[size], disabled ? "text-fg-disabled" : "text-fg")}>
					{label}
				</span>
			</label>
		);
	},
);
Toggle.displayName = "Toggle";

export type { ToggleProps };
export { Toggle, thumbVariants, toggleVariants };
