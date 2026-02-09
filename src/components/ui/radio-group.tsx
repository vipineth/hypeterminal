import { CircleIcon } from "@phosphor-icons/react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				"border-border-200 data-[state=checked]:border-primary-default text-primary-default focus-visible:border-primary-default/50 focus-visible:ring-primary-default/50 aria-invalid:ring-error-700/20 dark:aria-invalid:ring-error-700/40 aria-invalid:border-error-700 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				data-slot="radio-group-indicator"
				forceMount
				className="relative flex items-center justify-center transition-[scale,opacity] duration-150 ease-out data-[state=unchecked]:scale-50 data-[state=unchecked]:opacity-0"
			>
				<CircleIcon
					weight="fill"
					className="text-primary-default absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2"
				/>
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
