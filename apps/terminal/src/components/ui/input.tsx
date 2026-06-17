/**
 * Bare controlled input for the trade UI.
 *
 * This wraps `@base-ui/react/input` rather than `TextInput` from `@hypeterminal/ui`
 * because `TextInput` is a full form field (wraps the input in `Field.Root` with
 * label/hint/error slots). The trade UI needs a stripped-down input whose class
 * string composes directly with `cn()` at the callsite, with a tighter `sm` size
 * and tabular-num spacing for price/size entry. Do not replace with `TextInput`.
 */
import { Input as BaseInput } from "@base-ui/react/input";
import type * as React from "react";
import { cn } from "@/lib/cn";

type InputSize = "sm" | "default" | "lg" | "xl";
type InputProps = Omit<React.ComponentProps<typeof BaseInput>, "className"> & {
	inputSize?: InputSize;
	className?: string;
};

const inputBaseStyles = [
	"placeholder:text-fg-muted selection:bg-brand selection:text-white",
	"border-stroke-weak min-w-0 rounded-8 border bg-transparent px-2 py-1",
	"transition-[color,box-shadow,border-color] outline-none",
	"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
	"focus-visible:border-stroke-focus focus-visible:ring-stroke-focus/20 focus-visible:ring-[2px]",
	"aria-invalid:ring-stroke-error-strong/20 dark:aria-invalid:ring-stroke-error-strong/40 aria-invalid:border-stroke-error-strong",
].join(" ");

const inputSizeStyles: Record<InputSize, string> = {
	sm: "h-6 text-xs px-1.5",
	default: "h-7 text-xs",
	lg: "h-9 text-sm px-3",
	xl: "h-12 text-base px-3",
};

function getInputClassName(inputSize: InputSize, className?: string) {
	return cn(inputBaseStyles, inputSizeStyles[inputSize], className);
}

function Input({ className, type, inputSize = "default", ...props }: InputProps) {
	return (
		<BaseInput
			type={type}
			data-slot="input"
			data-size={inputSize}
			className={cn("w-full", getInputClassName(inputSize, className))}
			{...props}
		/>
	);
}

export { Input, inputBaseStyles, inputSizeStyles, getInputClassName };
export type { InputSize };
