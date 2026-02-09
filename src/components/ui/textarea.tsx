import type * as React from "react";
import { cn } from "@/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-border-200 placeholder:text-text-400 focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 aria-invalid:ring-error-700/20 dark:aria-invalid:ring-error-700/40 aria-invalid:border-error-700 dark:bg-fill-100/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
