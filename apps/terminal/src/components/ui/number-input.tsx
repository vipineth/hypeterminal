import { Input as BaseInput } from "@base-ui/react/input";
import type * as React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
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
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
	value,
	onChange,
	onKeyDown,
	disabled,
	...props
}: Props) {
	const effectiveAllowDecimals = allowDecimals && (maxAllowedDecimals === undefined || maxAllowedDecimals > 0);
	const hasMax = maxLabel != null && onMaxClick != null;

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
				const currentValue = parseFloat(input.value) || 0;
				const delta = e.key === "ArrowUp" ? step : -step;
				let newValue = currentValue + delta;

				if (min !== undefined && newValue < min) newValue = min;
				if (max !== undefined && newValue > max) newValue = max;
				if (!allowNegative && newValue < 0) newValue = 0;

				const newValueStr = effectiveAllowDecimals ? String(newValue) : String(Math.round(newValue));
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
			const isDecimal = e.key === "." && effectiveAllowDecimals;
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
		[effectiveAllowDecimals, allowNegative, min, max, step, onChange, onKeyDown, createSyntheticEvent],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;

			const isIntermediateState =
				inputValue === "" ||
				inputValue === "-" ||
				(effectiveAllowDecimals && (inputValue === "." || inputValue === "-."));

			if (isIntermediateState) {
				onChange?.(e);
				return;
			}

			if (!isValidNumberFormat(inputValue, effectiveAllowDecimals, allowNegative)) return;
			if (exceedsDecimalLimit(inputValue, maxAllowedDecimals)) return;

			onChange?.(e);
		},
		[effectiveAllowDecimals, allowNegative, maxAllowedDecimals, onChange],
	);

	const inputEl = (
		<BaseInput
			type="text"
			inputMode={effectiveAllowDecimals ? "decimal" : "numeric"}
			data-slot="input"
			data-size={inputSize}
			value={value}
			disabled={disabled}
			className={getInputClassName(inputSize, cn(hasMax && "pr-20", className))}
			onKeyDown={handleKeyDown}
			onChange={handleChange}
			{...props}
		/>
	);

	if (!hasMax) return inputEl;

	return (
		<div className="relative">
			{inputEl}
			<button
				type="button"
				onClick={onMaxClick}
				disabled={disabled}
				className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-brand hover:text-text-brand/80 active:scale-90 active:opacity-70 transition-all whitespace-nowrap tabular-nums disabled:opacity-50 disabled:pointer-events-none"
			>
				{maxLabel}
			</button>
		</div>
	);
}
