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
				"file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-sm border bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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
