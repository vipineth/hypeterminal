import type * as React from "react";
import { useCallback } from "react";
import clsx from "clsx";

interface Props extends Omit<React.ComponentProps<"input">, "type" | "onChange" | "min" | "max" | "step"> {
	inputSize?: "sm" | "default" | "lg";
	allowDecimals?: boolean;
	allowNegative?: boolean;
	min?: number;
	max?: number;
	step?: number;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function NumberInput({
	className,
	inputSize = "default",
	allowDecimals = true,
	allowNegative = false,
	min,
	max,
	step = 1,
	value,
	onChange,
	onKeyDown,
	...props
}: Props) {
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

				const newValueStr = allowDecimals ? String(newValue) : String(Math.round(newValue));
				const syntheticEvent = createSyntheticEvent(input, newValueStr);
				onChange?.(syntheticEvent);
				onKeyDown?.(e);
				return;
			}

			const allowedKeys = [
				"Backspace",
				"Delete",
				"Tab",
				"Escape",
				"Enter",
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End",
			];

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

			const input = e.currentTarget;
			const inputValue = input.value;
			const selectionStart = input.selectionStart ?? 0;

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
		[allowDecimals, allowNegative, min, max, step, onChange, onKeyDown, createSyntheticEvent],
	);

	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLInputElement>) => {
			const pastedText = e.clipboardData.getData("text");
			const pattern = allowDecimals
				? allowNegative
					? /^-?\d*\.?\d*$/
					: /^\d*\.?\d*$/
				: allowNegative
					? /^-?\d*$/
					: /^\d*$/;

			if (!pattern.test(pastedText)) {
				e.preventDefault();
			}
		},
		[allowDecimals, allowNegative],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;

			if (inputValue === "" || inputValue === "-" || (allowDecimals && (inputValue === "." || inputValue === "-."))) {
				onChange?.(e);
				return;
			}

			const pattern = allowDecimals
				? allowNegative
					? /^-?\d*\.?\d*$/
					: /^\d*\.?\d*$/
				: allowNegative
					? /^-?\d*$/
					: /^\d*$/;

			if (pattern.test(inputValue)) {
				onChange?.(e);
			}
		},
		[allowDecimals, allowNegative, onChange],
	);

	return (
		<input
			type="text"
			inputMode={allowDecimals ? "decimal" : "numeric"}
			data-slot="input"
			data-size={inputSize}
			value={value}
			className={clsx(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-w-0 rounded-sm border bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				inputSize === "sm" && "h-6 text-2xs px-1.5",
				inputSize === "default" && "h-7 text-xs",
				inputSize === "lg" && "h-9 text-sm px-3",
				className,
			)}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			onChange={handleChange}
			{...props}
		/>
	);
}

export { NumberInput };
