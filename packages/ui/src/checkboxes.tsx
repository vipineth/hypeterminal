import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { CheckIcon, MinusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const checkboxVariants = cva(
	[
		"relative inline-flex items-center justify-center shrink-0",
		"border rounded-4 bg-bg-base",
		"transition-colors duration-150",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-checked:bg-fill-brand-strong data-checked:border-transparent",
		"data-indeterminate:bg-fill-brand-strong data-indeterminate:border-transparent",
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
			error: {
				true: "border-stroke-error-strong",
				false: "border-stroke-strong",
			},
		},
		defaultVariants: {
			size: "sm",
			error: false,
		},
	},
);

const iconSizeMap = {
	xxs: 10,
	xs: 10,
	sm: 12,
	md: 14,
	lg: 16,
} as const;

interface CheckboxProps
	extends Omit<React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root>, "className">,
		VariantProps<typeof checkboxVariants> {
	className?: string;
	label?: React.ReactNode;
	description?: React.ReactNode;
	errorMessage?: string;
}

const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(
	({ className, size: sizeProp, error, label, description, errorMessage, disabled, indeterminate, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const iconSize = iconSizeMap[size ?? "md"];

		return (
			<label
				className={cn(
					"inline-flex items-start gap-2 select-none",
					disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
					className,
				)}
			>
				<BaseCheckbox.Root
					ref={ref}
					disabled={disabled}
					indeterminate={indeterminate}
					className={cn(checkboxVariants({ size, error }))}
					{...props}
				>
					<BaseCheckbox.Indicator className="flex items-center justify-center text-icon-inverse-strong">
						{indeterminate ? <MinusIcon size={iconSize} weight="bold" /> : <CheckIcon size={iconSize} weight="bold" />}
					</BaseCheckbox.Indicator>
				</BaseCheckbox.Root>
				{(label || description || (error && errorMessage)) && (
					<span className="flex flex-col gap-1">
						{label && <span className="text-xs text-text-strong">{label}</span>}
						{description && <span className="text-xs text-text-weak">{description}</span>}
						{error && errorMessage && (
							<span className="flex items-center gap-1">
								<WarningCircleIcon size={16} weight="fill" className="shrink-0 text-icon-error" />
								<span className="text-xs text-text-error">{errorMessage}</span>
							</span>
						)}
					</span>
				)}
			</label>
		);
	},
);
Checkbox.displayName = "Checkbox";

interface CheckboxGroupProps extends React.ComponentPropsWithoutRef<typeof BaseCheckboxGroup> {
	label?: string;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
	({ className, label, children, ...props }, ref) => (
		<BaseCheckboxGroup ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
			{label && <span className="text-xs font-semibold text-text-strong">{label}</span>}
			{children}
		</BaseCheckboxGroup>
	),
);
CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, checkboxVariants, CheckboxGroup };
export type { CheckboxProps, CheckboxGroupProps };
