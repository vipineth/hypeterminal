/**
 * String-based numeric input for the trade UI.
 *
 * This does NOT use `NumberInput` from `@hypeterminal/ui`. The package primitive
 * exposes a `number | null` value via `onValueChange` (built on @base-ui NumberField)
 * and wraps the input in `Field.Root` with label/hint/error slots. The tradebox
 * callers (size/price/TP/SL/leverage/trigger inputs) keep Hyperliquid price/size
 * strings end-to-end: API returns strings with exact decimals, they flow through
 * `onChange(string)` unchanged, are validated for decimal limits, and converted to
 * `Big()` only when math is required. Converting to `number` here would lose
 * precision (HL's sz/px can have up to 8 decimals). See `rules/hyperliquid.md`.
 *
 * The synthetic change event below enables the ArrowUp/ArrowDown keyboard stepper
 * without rewriting every caller's `onChange(e)` handler.
 */
import { Input as BaseInput } from "@base-ui/react/input";
import Big from "big.js";
import type * as React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
import { BIG_ZERO, toBig } from "@/lib/trade/numbers";
import { labelTypographyClass } from "./field-label";
import { getInputClassName, type InputSize } from "./input";

/**
 * Validates numeric input string format.
 * Pattern breakdown:
 *   ^        - start of string
 *   -?       - optional minus sign (only if allowNegative)
 *   \d*      - zero or more digits before decimal
 *   \.?      - optional decimal point (only if allowDecimals)
 *   \d*      - zero or more digits after decimal
 *   $        - end of string
 */
function isValidNumberFormat(value: string, allowDecimals: boolean, allowNegative: boolean): boolean {
	const pattern = allowDecimals
		? allowNegative
			? /^-?\d*\.?\d*$/
			: /^\d*\.?\d*$/
		: allowNegative
			? /^-?\d*$/
			: /^\d*$/;
	return pattern.test(value);
}

function exceedsDecimalLimit(value: string, maxDecimals: number | undefined): boolean {
	if (maxDecimals === undefined) return false;
	const dotIndex = value.indexOf(".");
	return dotIndex !== -1 && value.length - dotIndex - 1 > maxDecimals;
}

interface StepBounds {
	min: number | undefined;
	max: number | undefined;
	allowNegative: boolean;
	decimals: number | undefined;
}

function stepValue(value: string, delta: number, { min, max, allowNegative, decimals }: StepBounds): string {
	let next = (toBig(value) ?? BIG_ZERO).plus(delta);
	if (min !== undefined && next.lt(min)) next = Big(min);
	if (max !== undefined && next.gt(max)) next = Big(max);
	if (!allowNegative && next.lt(0)) next = BIG_ZERO;
	return decimals === undefined ? next.toFixed() : next.round(decimals, Big.roundDown).toFixed();
}

interface Props extends Omit<React.ComponentProps<"input">, "type" | "onChange" | "min" | "max" | "step"> {
	inputSize?: InputSize;
	allowDecimals?: boolean;
	allowNegative?: boolean;
	maxAllowedDecimals?: number;
	min?: number;
	max?: number;
	step?: number;
	maxLabel?: React.ReactNode;
	onMaxClick?: () => void;
	suffix?: React.ReactNode;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	label?: string;
	labelValue?: React.ReactNode;
	onLabelValueClick?: () => void;
}

export function NumberInput({
	className,
	inputSize = "default",
	allowDecimals = true,
	allowNegative = false,
	maxAllowedDecimals,
	min,
	max,
	step = 1,
	maxLabel,
	onMaxClick,
	suffix,
	value,
	onChange,
	onKeyDown,
	disabled,
	label,
	labelValue,
	onLabelValueClick,
	...props
}: Props) {
	const hasMax = maxLabel != null && onMaxClick != null;
	const hasSuffix = !hasMax && suffix != null;

	const createSyntheticEvent = useCallback(
		(input: HTMLInputElement, newValue: string): React.ChangeEvent<HTMLInputElement> => {
			const nativeEvent = new Event("change", { bubbles: true });
			Object.defineProperty(nativeEvent, "target", { writable: false, value: { ...input, value: newValue } });
			return {
				...nativeEvent,
				target: { ...input, value: newValue } as EventTarget & HTMLInputElement,
				currentTarget: { ...input, value: newValue } as EventTarget & HTMLInputElement,
				nativeEvent,
				isDefaultPrevented: () => false,
				isPropagationStopped: () => false,
				persist: () => {},
			} as React.ChangeEvent<HTMLInputElement>;
		},
		[],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				e.preventDefault();
				const input = e.currentTarget;
				const newValueStr = stepValue(input.value, e.key === "ArrowUp" ? step : -step, {
					min,
					max,
					allowNegative,
					decimals: allowDecimals ? maxAllowedDecimals : 0,
				});
				const syntheticEvent = createSyntheticEvent(input, newValueStr);
				onChange?.(syntheticEvent);
				onKeyDown?.(e);
				return;
			}

			const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];

			if (allowedKeys.includes(e.key)) {
				onKeyDown?.(e);
				return;
			}

			if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase())) {
				onKeyDown?.(e);
				return;
			}

			const isDigit = /^[0-9]$/.test(e.key);
			const isDecimal = e.key === "." && allowDecimals;
			const isMinus = e.key === "-" && allowNegative;

			if (!isDigit && !isDecimal && !isMinus) {
				e.preventDefault();
				return;
			}

			const inputValue = e.currentTarget.value;
			const selectionStart = e.currentTarget.selectionStart ?? 0;

			if (isDecimal && inputValue.includes(".")) {
				e.preventDefault();
				return;
			}

			if (isMinus && (selectionStart !== 0 || inputValue.includes("-"))) {
				e.preventDefault();
				return;
			}

			onKeyDown?.(e);
		},
		[allowDecimals, allowNegative, maxAllowedDecimals, min, max, step, onChange, onKeyDown, createSyntheticEvent],
	);

	const validateInputValue = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;

			const isIntermediateState =
				inputValue === "" ||
				inputValue === "-" ||
				(allowDecimals && (inputValue === "." || inputValue === "-."));

			if (isIntermediateState) {
				onChange?.(e);
				return;
			}

			if (!isValidNumberFormat(inputValue, allowDecimals, allowNegative)) return;
			if (exceedsDecimalLimit(inputValue, maxAllowedDecimals)) return;

			onChange?.(e);
		},
		[allowDecimals, allowNegative, maxAllowedDecimals, onChange],
	);

	const inputEl = (
		<BaseInput
			type="text"
			inputMode={allowDecimals ? "decimal" : "numeric"}
			data-slot="input"
			data-size={inputSize}
			value={value}
			disabled={disabled}
			className={getInputClassName(inputSize, cn(hasMax && "pr-20", hasSuffix && "pr-7", className))}
			onKeyDown={handleKeyDown}
			onChange={validateInputValue}
			{...props}
		/>
	);

	function renderInputWithAction() {
		if (hasMax) {
			return (
				<div className="relative">
					{inputEl}
					<button
						type="button"
						onClick={onMaxClick}
						disabled={disabled}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand hover:text-brand/80 active:scale-90 active:opacity-70 transition-[color,opacity,transform] whitespace-nowrap tabular-nums disabled:opacity-50 disabled:pointer-events-none"
					>
						{maxLabel}
					</button>
				</div>
			);
		}
		if (hasSuffix) {
			return (
				<div className="relative">
					{inputEl}
					<span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-fg-muted whitespace-nowrap tabular-nums">
						{suffix}
					</span>
				</div>
			);
		}
		return inputEl;
	}

	const inputWithAction = renderInputWithAction();

	if (!label) return inputWithAction;

	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between">
				<span className={labelTypographyClass}>{label}</span>
				{labelValue != null && onLabelValueClick ? (
					<button
						type="button"
						onClick={onLabelValueClick}
						disabled={disabled}
						className="text-3xs text-fg-muted tabular-nums leading-none hover:text-fg transition-colors cursor-pointer disabled:pointer-events-none"
					>
						{labelValue}
					</button>
				) : labelValue != null ? (
					<span className="text-3xs text-fg-muted tabular-nums leading-none">{labelValue}</span>
				) : null}
			</div>
			{inputWithAction}
		</div>
	);
}
