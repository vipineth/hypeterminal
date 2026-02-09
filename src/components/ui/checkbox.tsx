import { CheckIcon } from "@phosphor-icons/react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer border-border-200 data-[state=checked]:bg-primary-default data-[state=checked]:text-white data-[state=checked]:border-primary-default focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 aria-invalid:ring-error-700/20 dark:aria-invalid:ring-error-700/40 aria-invalid:border-error-700 size-4 shrink-0 rounded-xs border transition outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				forceMount
				className="grid place-content-center text-current transition-[scale,opacity] duration-150 ease-out data-[state=unchecked]:scale-50 data-[state=unchecked]:opacity-0"
			>
				<CheckIcon className="size-3" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
