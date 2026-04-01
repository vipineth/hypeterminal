import { Field } from "@base-ui/react/field";
import { Select as BaseSelect } from "@base-ui/react/select";
import { CaretDownIcon, CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const selectTriggerVariants = cva(
	[
		"group/trigger flex items-center w-full rounded-8 border transition-colors",
		"cursor-pointer select-none",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-popup-open:border-stroke-focus",
	],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 gap-1",
				xs: "py-1 px-2 gap-1",
				sm: "py-1.5 px-3 gap-1.5",
				md: "py-2 px-3 gap-2",
				lg: "py-3 px-4 gap-2",
			},
			error: {
				true: "border-stroke-error-strong bg-fill-error-weak",
				false: "border-stroke-strong bg-bg-base",
			},
		},
		defaultVariants: {
			size: "sm",
			error: false,
		},
	},
);

interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

interface SelectGroupOption {
	label: string;
	options: SelectOption[];
}

interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
	label?: string;
	helperText?: string;
	placeholder?: string;
	options: (SelectOption | SelectGroupOption)[];
	errorMessage?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	name?: string;
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
}

function isGroupOption(option: SelectOption | SelectGroupOption): option is SelectGroupOption {
	return "options" in option;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
	(
		{
			className,
			size: sizeProp,
			error,
			label,
			helperText,
			placeholder = "Select an option",
			options,
			errorMessage,
			required = false,
			disabled = false,
			name,
			value,
			defaultValue,
			onValueChange,
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const renderItem = (option: SelectOption) => (
			<BaseSelect.Item
				key={option.value}
				value={option.value}
				disabled={option.disabled}
				className={cn(
					"flex items-center justify-between gap-2 px-3 py-2 rounded-8 cursor-pointer select-none",
					size === "lg" ? "text-sm" : "text-xs",
					"text-text-strong",
					"data-highlighted:bg-fill-hover",
					"data-disabled:text-text-disabled data-disabled:cursor-not-allowed",
				)}
			>
				<BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
				<BaseSelect.ItemIndicator className="text-icon-brand">
					<CheckIcon size={16} weight="bold" />
				</BaseSelect.ItemIndicator>
			</BaseSelect.Item>
		);

		return (
			<Field.Root className={cn("flex flex-col gap-1", className)} disabled={disabled} name={name} ref={ref}>
				{label && (
					<Field.Label className="text-xs font-semibold text-text-strong data-disabled:text-text-disabled">
						{label}
						{required && <span className="text-text-error"> *</span>}
					</Field.Label>
				)}
				{helperText && (
					<Field.Description className="text-xs text-text-weak data-disabled:text-text-disabled">
						{helperText}
					</Field.Description>
				)}

				<BaseSelect.Root
					value={value !== undefined ? value : undefined}
					defaultValue={defaultValue !== undefined ? defaultValue : undefined}
					onValueChange={onValueChange ? (val) => onValueChange(val as string | null) : undefined}
					disabled={disabled}
					required={required}
					name={name}
				>
					<BaseSelect.Trigger
						className={cn(
							selectTriggerVariants({ size, error }),
							"data-disabled:border-stroke-disabled data-disabled:cursor-not-allowed data-disabled:opacity-40",
						)}
					>
						<BaseSelect.Value
							placeholder={placeholder}
							className={cn(
								"flex-1 text-left truncate",
								size === "lg" ? "text-sm" : "text-xs",
								"text-text-strong",
								"data-placeholder:text-text-weak",
							)}
						/>
						<BaseSelect.Icon className="shrink-0 text-icon-neutral">
							<CaretDownIcon size={size === "sm" ? 16 : 20} weight="bold" />
						</BaseSelect.Icon>
					</BaseSelect.Trigger>

					<BaseSelect.Portal>
						<BaseSelect.Positioner sideOffset={4}>
							<BaseSelect.Popup className="z-50 bg-bg-overlay shadow-overlay rounded-12 border border-stroke-weak p-1 overflow-auto max-h-64 transition-[opacity,transform] duration-150 ease-out origin-(--transform-origin) data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95">
								{options.map((option) =>
									isGroupOption(option) ? (
										<BaseSelect.Group key={option.label}>
											<BaseSelect.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-text-weak select-none">
												{option.label}
											</BaseSelect.GroupLabel>
											{option.options.map(renderItem)}
										</BaseSelect.Group>
									) : (
										renderItem(option)
									),
								)}
							</BaseSelect.Popup>
						</BaseSelect.Positioner>
					</BaseSelect.Portal>
				</BaseSelect.Root>

				{error && errorMessage && (
					<div className="flex items-center gap-1">
						<WarningCircleIcon size={16} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs text-text-error">{errorMessage}</span>
					</div>
				)}
			</Field.Root>
		);
	},
);
Select.displayName = "Select";

export { Select, selectTriggerVariants };
export type { SelectProps, SelectOption, SelectGroupOption };
