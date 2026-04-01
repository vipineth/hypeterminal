import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const radioIndicatorVariants = cva(
	[
		"relative inline-flex items-center justify-center shrink-0 mt-0.5",
		"rounded-full border-2 transition-colors duration-150",
		"border-stroke-strong",
		"data-checked:bg-fill-selected data-checked:border-stroke-selected",
		"[&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2 [&:has(:focus-visible)]:outline-stroke-focus",
		"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-10",
	],
	{
		variants: {
			size: {
				xxs: "size-3",
				xs: "size-3.5",
				sm: "size-4",
				md: "size-5",
				lg: "size-6",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

const radioDotVariants = cva(
	[
		"rounded-full bg-fill-white",
		"transition-transform duration-150 motion-reduce:transition-none",
		"data-unchecked:scale-0 data-checked:scale-100",
	],
	{
		variants: {
			size: {
				xxs: "size-1",
				xs: "size-1",
				sm: "size-1.5",
				md: "size-2",
				lg: "size-2.5",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

const radioItemVariants = cva(
	[
		"inline-flex items-start cursor-pointer",
		"[&:has([data-disabled])]:opacity-40 [&:has([data-disabled])]:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "gap-1.5",
				xs: "gap-1.5",
				sm: "gap-2",
				md: "gap-3",
				lg: "gap-3",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof BaseRadioGroup> {
	orientation?: "vertical" | "horizontal";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
	({ className, orientation = "vertical", ...props }, ref) => (
		<BaseRadioGroup
			ref={ref}
			className={cn("flex", orientation === "vertical" ? "flex-col gap-3" : "flex-row gap-6", className)}
			{...props}
		/>
	),
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps
	extends Omit<React.ComponentPropsWithoutRef<typeof Radio.Root>, "children">,
		VariantProps<typeof radioIndicatorVariants> {
	label?: React.ReactNode;
	description?: React.ReactNode;
}

const RadioGroupItem = React.forwardRef<HTMLSpanElement, RadioGroupItemProps>(
	({ className, size: sizeProp, label, description, disabled, value, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<label className={cn(radioItemVariants({ size }), className)}>
				<Radio.Root
					ref={ref}
					value={value}
					disabled={disabled}
					className={cn(radioIndicatorVariants({ size }))}
					{...props}
				>
					<Radio.Indicator keepMounted className={cn(radioDotVariants({ size }))} />
				</Radio.Root>
				{(label || description) && (
					<div className="flex flex-col">
						{label && (
							<span
								className={cn(
									"text-text-strong font-normal select-none",
									size === "xxs" || size === "xs" || size === "sm"
										? "text-xs"
										: size === "lg"
											? "text-base"
											: "text-sm",
								)}
							>
								{label}
							</span>
						)}
						{description && <span className="text-xs text-text-weak mt-0.5 select-none">{description}</span>}
					</div>
				)}
			</label>
		);
	},
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem, radioIndicatorVariants, radioItemVariants };
export type { RadioGroupProps, RadioGroupItemProps };
