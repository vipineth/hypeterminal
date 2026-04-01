import { MagnifyingGlassIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const searchInputVariants = cva(
	[
		"group flex items-center w-full rounded-8 border transition-colors",
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

interface SearchInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
		VariantProps<typeof searchInputVariants> {
	label?: string;
	helperText?: string;
	errorMessage?: string;
	onClear?: () => void;
}

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
			...props
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? "");
		const currentValue = value !== undefined ? value.toString() : internalValue;
		const hasValue = currentValue.length > 0;

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

		const iconSize = size === "xxs" ? 12 : size === "xs" ? 14 : size === "sm" ? 16 : 20;

		return (
			<div className={cn("flex flex-col gap-1", className)}>
				{label && (
					<span className="text-xs font-semibold text-text-strong">
						{label}
						{required && <span className="text-text-error"> *</span>}
					</span>
				)}
				{helperText && <span className="text-xs text-text-weak">{helperText}</span>}
				<div data-disabled={disabled || undefined} className={cn(searchInputVariants({ size, error }))}>
					<MagnifyingGlassIcon
						size={iconSize}
						weight="bold"
						className="shrink-0 text-icon-neutral group-data-disabled:text-icon-disabled"
					/>
					<input
						ref={ref}
						type="search"
						value={currentValue}
						onChange={handleChange}
						disabled={disabled}
						required={required}
						className={cn(
							"flex-1 min-w-0 bg-transparent outline-none",
							"[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
							size === "md" || size === "lg" ? "text-sm" : size === "xxs" ? "text-2xs" : "text-xs",
							"text-text-strong placeholder:text-text-weak",
							"disabled:text-text-disabled disabled:placeholder:text-text-disabled disabled:cursor-not-allowed",
						)}
						{...props}
					/>
					{hasValue && !disabled && (
						<button
							type="button"
							onClick={handleClear}
							tabIndex={-1}
							aria-label="Clear search"
							className="relative shrink-0 cursor-pointer text-icon-neutral hover:text-text-strong transition-colors after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-10"
						>
							<XIcon size={iconSize} weight="bold" />
						</button>
					)}
				</div>
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

SearchInput.displayName = "SearchInput";

export { SearchInput, searchInputVariants };
export type { SearchInputProps };
