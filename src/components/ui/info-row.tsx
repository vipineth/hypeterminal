import type * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InfoRowProps extends Omit<React.ComponentProps<"div">, "children"> {
	label: ReactNode;
	value: ReactNode;
	valueClassName?: string;
	labelClassName?: string;
}

function InfoRow({ label, value, valueClassName, labelClassName, className, ...props }: InfoRowProps) {
	return (
		<div data-slot="info-row" className={cn("flex items-center justify-between px-2 py-1.5", className)} {...props}>
			<span data-slot="info-row-label" className={cn("text-text-600", labelClassName)}>
				{label}
			</span>
			<span data-slot="info-row-value" className={cn("tabular-nums text-text-950", valueClassName)}>
				{value}
			</span>
		</div>
	);
}

function InfoRowGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="info-row-group"
			className={cn("divide-y divide-border-200 text-2xs tracking-[0.5px]", className)}
			{...props}
		/>
	);
}

export { InfoRow, InfoRowGroup };
