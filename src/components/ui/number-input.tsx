import type * as React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/cn";

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
	inputSize?: "sm" | "default" | "lg";
	allowDecimals?: boolean;
	allowNegative?: boolean;
	maxAllowedDecimals?: number;
	min?: number;
	max?: number;
	step?: number;
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
	value,
	onChange,
	onKeyDown,
	...props
}: Props) {
	const effectiveAllowDecimals = allowDecimals && (maxAllowedDecimals === undefined || maxAllowedDecimals > 0);

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

	return (
		<input
			type="text"
			inputMode={effectiveAllowDecimals ? "decimal" : "numeric"}
			data-slot="input"
			data-size={inputSize}
			value={value}
			className={cn(
				"file:text-fg placeholder:text-muted-fg selection:bg-primary selection:text-primary-fg dark:bg-input/30 border-border min-w-0 rounded-sm border bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-danger/20 dark:aria-invalid:ring-danger/40 aria-invalid:border-danger",
				inputSize === "sm" && "h-6 text-2xs px-1.5",
				inputSize === "default" && "h-7 text-xs",
				inputSize === "lg" && "h-9 text-sm px-3",
				className,
			)}
			onKeyDown={handleKeyDown}
			onChange={handleChange}
			{...props}
		/>
	);
}
