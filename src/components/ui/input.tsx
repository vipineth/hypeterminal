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
				"file:text-text-950 placeholder:text-text-400 selection:bg-primary-default selection:text-white dark:bg-fill-100/30 border-border-200 w-full min-w-0 rounded-sm border bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-error-700/20 dark:aria-invalid:ring-error-700/40 aria-invalid:border-error-700",
				inputSize === "sm" && "h-6 text-2xs px-1.5",
				inputSize === "default" && "h-7 text-xs",
				inputSize === "lg" && "h-9 text-sm px-3",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
