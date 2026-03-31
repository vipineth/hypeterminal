import { Input as BaseInput } from "@base-ui/react/input";
import type * as React from "react";
import { cn } from "@/lib/cn";

type InputSize = "sm" | "default" | "lg";

const inputBaseStyles = [
	"placeholder:text-text-disabled selection:bg-fill-brand-strong selection:text-white",
	"border-stroke-weak min-w-0 rounded-8 border bg-transparent px-2 py-1",
	"transition-[color,box-shadow,border-color] outline-none",
	"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
	"focus-visible:border-stroke-brand-strong focus-visible:ring-stroke-brand-strong/20 focus-visible:ring-[2px]",
	"aria-invalid:ring-stroke-error-strong/20 dark:aria-invalid:ring-stroke-error-strong/40 aria-invalid:border-stroke-error-strong",
].join(" ");

const inputSizeStyles: Record<InputSize, string> = {
	sm: "h-6 text-xs px-1.5",
	default: "h-7 text-xs",
	lg: "h-9 text-sm px-3",
};

function getInputClassName(inputSize: InputSize, className?: string) {
	return cn(inputBaseStyles, inputSizeStyles[inputSize], className);
}

function Input({
	className,
	type,
	inputSize = "default",
	...props
}: React.ComponentProps<typeof BaseInput> & {
	inputSize?: InputSize;
}) {
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
