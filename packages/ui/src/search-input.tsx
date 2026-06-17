import { MagnifyingGlassIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const searchInputVariants = cva(
	[
		"group flex items-center w-full rounded-8 border transition-colors duration-150 motion-reduce:transition-none",
		"focus-within:border-stroke-focus",
		"data-disabled:border-stroke-disabled data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 gap-1",
				xs: "py-1 px-2 gap-1",
				sm: "py-1.5 px-2 gap-1.5",
				md: "py-2 px-3 gap-2",
				lg: "p-3 gap-2",
			},
			error: {
				true: "border-stroke-error-strong bg-error-soft",
				false: "border-stroke-strong bg-background",
			},
		},
		defaultVariants: {
			size: "sm",
			error: false,
		},
	},
);

interface SearchInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
		VariantProps<typeof searchInputVariants> {
	label?: string;
	helperText?: string;
	errorMessage?: string;
	onClear?: () => void;
}

type SearchInputSize = "xxs" | "xs" | "sm" | "md" | "lg";

const searchIconSizes: Record<SearchInputSize, number> = {
	xxs: 12,
	xs: 14,
	sm: 16,
	md: 20,
	lg: 20,
};

const searchInputTextClasses: Record<SearchInputSize, string> = {
	xxs: "text-2xs",
	xs: "text-xs",
	sm: "text-xs",
	md: "text-sm",
	lg: "text-sm",
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			errorMessage,
			required,
			disabled,
			size: sizeProp,
			value,
			defaultValue,
			onChange,
			onClear,
			id,
			...props
		},
		ref,
	) => {
		const size = (sizeProp ?? DEFAULT_SIZE) as SearchInputSize;
		const reactId = React.useId();
		const inputId = id ?? reactId;
		const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? "");
		const currentValue = value !== undefined ? value.toString() : internalValue;
		const hasValue = currentValue.length > 0;

		const updateSearchValue = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (value === undefined) {
				setInternalValue(e.target.value);
			}
			onChange?.(e);
		};

		const handleClear = () => {
			if (value === undefined) {
				setInternalValue("");
			}
			onClear?.();
		};

		const iconSize = searchIconSizes[size];

		return (
			<div className={cn("flex flex-col gap-1", className)}>
				{label && (
					<label htmlFor={inputId} className="text-xs font-semibold text-fg">
						{label}
						{required && <span className="text-error"> *</span>}
					</label>
				)}
				{helperText && <span className="text-xs text-fg-muted">{helperText}</span>}
				<div data-disabled={disabled || undefined} className={cn(searchInputVariants({ size, error }))}>
					<MagnifyingGlassIcon
						size={iconSize}
						weight="bold"
						className="shrink-0 text-icon group-data-disabled:text-icon-disabled"
					/>
					<input
						ref={ref}
						id={inputId}
						type="search"
						value={currentValue}
						onChange={updateSearchValue}
						disabled={disabled}
						required={required}
						className={cn(
							"flex-1 min-w-0 bg-transparent outline-none",
							"[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
							searchInputTextClasses[size],
							"text-fg placeholder:text-fg-muted",
							"disabled:text-fg-disabled disabled:placeholder:text-fg-disabled disabled:cursor-not-allowed",
						)}
						{...props}
					/>
					{hasValue && !disabled && (
						<button
							type="button"
							onClick={handleClear}
							tabIndex={-1}
							aria-label="Clear search"
							className="relative shrink-0 cursor-pointer text-icon hover:text-fg transition-colors duration-150 motion-reduce:transition-none after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-11"
						>
							<XIcon size={iconSize} weight="bold" />
						</button>
					)}
				</div>
				{error && errorMessage && (
					<div className="flex items-center gap-1">
						<WarningCircleIcon size={16} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs text-error">{errorMessage}</span>
					</div>
				)}
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";

export { SearchInput, searchInputVariants };
export type { SearchInputProps };
