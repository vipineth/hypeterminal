import { Field } from "@base-ui/react/field";
import { NumberField } from "@base-ui/react/number-field";
import { MinusIcon, PlusIcon, XCircleIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const numberInputVariants = cva(
	["flex items-center w-full rounded-8", "bg-fill-inverse-strong transition-colors duration-150"],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 gap-1",
				xs: "py-1 px-2 gap-1",
				sm: "py-1.5 px-3 gap-1.5",
				md: "py-2 px-4 gap-2",
				lg: "py-3 px-4 gap-2",
			},
			invalid: {
				true: "border-2 border-stroke-error-strong bg-fill-error-weak",
				false: "border border-stroke-strong hover:bg-fill-hover active:bg-fill-press",
			},
		},
		defaultVariants: {
			size: "sm",
			invalid: false,
		},
	},
);

const stepperButtonClasses = [
	"inline-flex items-center justify-center shrink-0 rounded-4",
	"text-icon-neutral hover:bg-fill-hover active:bg-fill-press",
	"transition-colors duration-150 cursor-pointer select-none",
	"focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stroke-focus",
	"data-disabled:opacity-40 data-disabled:cursor-not-allowed data-disabled:pointer-events-none",
].join(" ");

interface NumberInputProps extends Omit<VariantProps<typeof numberInputVariants>, "invalid"> {
	value?: number | null;
	defaultValue?: number | null;
	onValueChange?: (value: number | null, details: NumberField.Root.ChangeEventDetails) => void;
	onValueCommitted?: (value: number | null, details: NumberField.Root.CommitEventDetails) => void;
	min?: number;
	max?: number;
	step?: number | "any";
	smallStep?: number;
	largeStep?: number;
	format?: Intl.NumberFormatOptions;
	locale?: Intl.LocalesArgument;
	allowOutOfRange?: boolean;
	allowWheelScrub?: boolean;
	label?: string;
	hint?: string;
	error?: string;
	required?: boolean;
	optional?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	name?: string;
	id?: string;
	placeholder?: string;
	autoFocus?: boolean;
	selectOnFocus?: boolean;
	showStepper?: boolean;
	iconLeft?: React.ReactNode;
	className?: string;
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
	onFocus?: React.FocusEventHandler<HTMLInputElement>;
}

const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
	(
		{
			className,
			size: sizeProp,
			value,
			defaultValue,
			onValueChange,
			onValueCommitted,
			min,
			max,
			step,
			smallStep,
			largeStep,
			format,
			locale,
			allowOutOfRange,
			allowWheelScrub,
			label,
			hint,
			error,
			required,
			optional,
			disabled,
			readOnly,
			name,
			id,
			placeholder,
			autoFocus,
			selectOnFocus,
			showStepper = false,
			iconLeft,
			onBlur,
			onFocus,
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const isInvalid = !!error;
		const stepperSize = size === "lg" ? 20 : size === "md" ? 18 : size === "sm" ? 16 : size === "xs" ? 14 : 12;

		const handleFocus = React.useCallback(
			(e: React.FocusEvent<HTMLInputElement>) => {
				if (selectOnFocus) {
					e.target.select();
				}
				onFocus?.(e);
			},
			[selectOnFocus, onFocus],
		);

		return (
			<Field.Root className="group flex flex-col gap-1 w-full" disabled={disabled} invalid={isInvalid} name={name}>
				{label && (
					<div className="flex flex-col">
						<Field.Label className="flex gap-1 items-baseline text-sm font-normal cursor-default">
							<span className="text-text-strong group-data-disabled:text-text-disabled">{label}</span>
							{required && <span className="text-text-weak group-data-disabled:text-text-disabled">*</span>}
							{optional && (
								<span className="text-xs text-text-weak group-data-disabled:text-text-disabled">(optional)</span>
							)}
						</Field.Label>
						{hint && <Field.Description className="text-xs text-text-weak">{hint}</Field.Description>}
					</div>
				)}
				{error && (
					<Field.Error match className="flex items-center gap-2 py-1">
						<XCircleIcon size={24} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs font-semibold text-text-error">{error}</span>
					</Field.Error>
				)}
				<NumberField.Root
					ref={ref}
					id={id}
					value={value}
					defaultValue={defaultValue ?? undefined}
					onValueChange={onValueChange}
					onValueCommitted={onValueCommitted}
					min={min}
					max={max}
					step={step}
					smallStep={smallStep}
					largeStep={largeStep}
					format={format}
					locale={locale}
					allowOutOfRange={allowOutOfRange}
					allowWheelScrub={allowWheelScrub}
					required={required}
					disabled={disabled}
					readOnly={readOnly}
					name={name}
				>
					<NumberField.Group
						className={cn(
							numberInputVariants({ size, invalid: isInvalid }),
							"group-data-disabled:border-stroke-disabled group-data-disabled:cursor-not-allowed",
							"focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stroke-focus",
							className,
						)}
					>
						{showStepper && !readOnly && (
							<NumberField.Decrement className={stepperButtonClasses}>
								<MinusIcon size={stepperSize} weight="bold" />
							</NumberField.Decrement>
						)}
						{iconLeft && (
							<span className="shrink-0 text-icon-neutral group-data-disabled:text-icon-disabled">{iconLeft}</span>
						)}
						<NumberField.Input
							placeholder={placeholder ?? "0"}
							autoFocus={autoFocus}
							onFocus={handleFocus}
							onBlur={onBlur}
							className={cn(
								"flex-1 min-w-0 bg-transparent outline-none tabular-nums",
								size === "xxs"
									? "text-2xs"
									: size === "xs" || size === "sm"
										? "text-xs"
										: size === "lg"
											? "text-base"
											: "text-sm",
								"font-normal text-text-strong placeholder:text-text-weak",
								"data-disabled:text-text-disabled data-disabled:placeholder:text-text-disabled data-disabled:cursor-not-allowed",
							)}
						/>
						{showStepper && !readOnly && (
							<NumberField.Increment className={stepperButtonClasses}>
								<PlusIcon size={stepperSize} weight="bold" />
							</NumberField.Increment>
						)}
					</NumberField.Group>
				</NumberField.Root>
			</Field.Root>
		);
	},
);
NumberInput.displayName = "NumberInput";

export { NumberInput, numberInputVariants };
export type { NumberInputProps };
