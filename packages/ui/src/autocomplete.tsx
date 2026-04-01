import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, MagnifyingGlassIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const autocompleteVariants = cva(
	[
		"group flex items-center w-full rounded-8 border transition-colors",
		"focus-within:border-stroke-focus",
		"data-disabled:border-stroke-disabled",
	],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5",
				xs: "py-1 px-2",
				sm: "py-1.5 px-2",
				md: "py-2 px-3",
				lg: "py-3 px-4",
			},
			error: {
				true: "border-stroke-error-strong bg-fill-error-weak",
				false: "border-stroke-strong bg-bg-base",
			},
			type: {
				single: "gap-2",
				multiple: "flex-wrap gap-1.5",
			},
		},
		defaultVariants: {
			size: "sm",
			error: false,
			type: "single",
		},
	},
);

interface AutocompleteProps extends Omit<VariantProps<typeof autocompleteVariants>, "size" | "type"> {
	label?: string;
	helperText?: string;
	placeholder?: string;
	options: string[];
	multiple?: boolean;
	errorMessage?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
	value?: string | string[] | null;
	defaultValue?: string | string[] | null;
	onValueChange?: (value: string | string[] | null) => void;
}

const Autocomplete = React.forwardRef<HTMLDivElement, AutocompleteProps>(
	(
		{
			className,
			size: sizeProp,
			label,
			helperText,
			placeholder = "Start typing to search",
			options,
			multiple = false,
			error,
			errorMessage,
			required = false,
			disabled = false,
			value,
			defaultValue,
			onValueChange,
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const filter = Combobox.useFilter();
		const [query, setQuery] = React.useState("");
		const [internalMultiValue, setInternalMultiValue] = React.useState<string[]>(
			multiple && Array.isArray(defaultValue) ? defaultValue : [],
		);

		const multiValue = multiple && value !== undefined ? (value as string[]) : internalMultiValue;

		const filteredOptions = React.useMemo(
			() => (query ? options.filter((opt) => filter.contains(opt, query)) : options),
			[options, query, filter],
		);

		const handleValueChange = React.useCallback(
			(newValue: string | string[] | null) => {
				if (multiple && Array.isArray(newValue)) {
					setInternalMultiValue(newValue);
				}
				onValueChange?.(newValue);
			},
			[multiple, onValueChange],
		);

		const comboboxProps = {
			disabled,
			openOnInputClick: true,
			onInputValueChange: (val: string) => setQuery(val),
			onOpenChange: (open: boolean) => {
				if (open) setQuery("");
			},
		};

		const renderInputGroup = (
			<Combobox.InputGroup
				className={cn(
					autocompleteVariants({
						size,
						error,
						type: multiple ? "multiple" : "single",
					}),
				)}
			>
				<MagnifyingGlassIcon
					size={size === "sm" ? 16 : 20}
					weight="bold"
					className="shrink-0 text-icon-neutral group-data-disabled:text-icon-disabled"
				/>
				{multiple && multiValue.length > 0 && (
					<Combobox.Chips className="contents">
						{multiValue.map((val) => (
							<Combobox.Chip
								key={val}
								className="inline-flex items-center gap-1 rounded-4 bg-fill-brand-weak px-2 py-0.5 text-xs text-text-strong"
							>
								{val}
								<Combobox.ChipRemove className="shrink-0 cursor-pointer text-icon-neutral hover:text-text-strong">
									<XIcon size={12} weight="bold" />
								</Combobox.ChipRemove>
							</Combobox.Chip>
						))}
					</Combobox.Chips>
				)}
				<Combobox.Input
					placeholder={multiple && multiValue.length > 0 ? "" : placeholder}
					className={cn(
						"flex-1 min-w-0 bg-transparent outline-none",
						size === "lg" ? "text-sm" : "text-xs",
						multiple && "min-w-16",
						"text-text-strong placeholder:text-text-weak",
						"data-disabled:text-text-disabled data-disabled:placeholder:text-text-disabled",
					)}
				/>
				{multiple && multiValue.length > 0 && (
					<Combobox.Clear className="shrink-0 cursor-pointer text-icon-neutral hover:text-text-strong">
						<XIcon size={16} weight="bold" />
					</Combobox.Clear>
				)}
			</Combobox.InputGroup>
		);

		const renderPopup = (
			<Combobox.Portal>
				<Combobox.Positioner sideOffset={4}>
					<Combobox.Popup className="z-50 bg-bg-overlay shadow-overlay rounded-12 border border-stroke-weak p-1 overflow-auto max-h-64 transition-[opacity,transform] duration-150 ease-out origin-(--transform-origin) data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95">
						<Combobox.List>
							{filteredOptions.map((option) => (
								<Combobox.Item
									key={option}
									value={option}
									className={cn(
										"group/item flex items-center gap-2 px-3 py-2 text-text-strong rounded-8 cursor-pointer select-none data-highlighted:bg-fill-hover",
										size === "lg" ? "text-sm" : "text-xs",
									)}
								>
									{multiple && (
										<span className="inline-flex items-center justify-center size-4 rounded-4 border shrink-0 transition-colors border-stroke-strong group-data-selected/item:bg-fill-selected group-data-selected/item:border-stroke-selected">
											<Combobox.ItemIndicator>
												<CheckIcon size={10} weight="bold" className="text-text-inverse-strong" />
											</Combobox.ItemIndicator>
										</span>
									)}
									<span className="flex-1">{option}</span>
									{!multiple && (
										<Combobox.ItemIndicator>
											<CheckIcon size={16} weight="bold" className="text-text-brand" />
										</Combobox.ItemIndicator>
									)}
								</Combobox.Item>
							))}
							<Combobox.Empty className="px-3 py-2 text-xs text-text-weak">No results found</Combobox.Empty>
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		);

		return (
			<div className={cn("flex flex-col gap-1", className)} ref={ref}>
				{label && (
					<span className="text-xs font-semibold text-text-strong">
						{label}
						{required && <span className="text-text-error"> *</span>}
					</span>
				)}
				{helperText && <span className="text-xs text-text-weak">{helperText}</span>}

				{multiple ? (
					<Combobox.Root
						multiple
						{...comboboxProps}
						value={value !== undefined ? (value as string[]) : undefined}
						defaultValue={Array.isArray(defaultValue) ? defaultValue : undefined}
						onValueChange={handleValueChange as (value: string[], details: Combobox.Root.ChangeEventDetails) => void}
					>
						{renderInputGroup}
						{renderPopup}
					</Combobox.Root>
				) : (
					<Combobox.Root
						{...comboboxProps}
						value={value !== undefined ? (value as string | null) : undefined}
						defaultValue={defaultValue !== undefined && !Array.isArray(defaultValue) ? defaultValue : undefined}
						onValueChange={
							handleValueChange as (value: string | null, details: Combobox.Root.ChangeEventDetails) => void
						}
					>
						{renderInputGroup}
						{renderPopup}
					</Combobox.Root>
				)}

				{error && errorMessage && (
					<div className="flex items-center gap-1">
						<WarningCircleIcon size={16} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs text-text-error">{errorMessage}</span>
					</div>
				)}
			</div>
		);
	},
);

Autocomplete.displayName = "Autocomplete";

export { Autocomplete, autocompleteVariants };
export type { AutocompleteProps };
