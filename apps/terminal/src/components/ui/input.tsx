import type * as React from "react";
import { cn } from "@/lib/cn";

function Input({
	className,
	type,
	inputSize = "default",
	...props
}: React.ComponentProps<"input"> & {
	inputSize?: "sm" | "default" | "lg";
}) {
	return (
		<input
			type={type}
			data-slot="input"
			data-size={inputSize}
			className={cn(
				"file:text-text-strong placeholder:text-text-disabled selection:bg-fill-brand-strong selection:text-white dark:bg-fill-100/30 border-stroke-weak w-full min-w-0 rounded-8 border bg-transparent px-2 py-1 shadow-raised transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-stroke-error-strong/20 dark:aria-invalid:ring-stroke-error-strong/40 aria-invalid:border-stroke-error-strong",
				inputSize === "sm" && "h-6 text-xs px-1.5",
				inputSize === "default" && "h-7 text-xs",
				inputSize === "lg" && "h-9 text-sm px-3",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
