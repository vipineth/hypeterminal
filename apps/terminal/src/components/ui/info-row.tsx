import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InfoRowProps {
	label: ReactNode;
	value: ReactNode;
	valueClassName?: string;
	labelClassName?: string;
	className?: string;
}

export function InfoRow({ label, value, valueClassName, labelClassName, className }: InfoRowProps) {
	return (
		<div className={cn("flex items-center justify-between px-2 py-1.5", className)} data-slot="info-row">
			<span className={cn("text-text-weak", labelClassName)} data-slot="info-row-label">
				{label}
			</span>
			<span className={cn("text-text-strong tabular-nums", valueClassName)} data-slot="info-row-value">
				{value}
			</span>
		</div>
	);
}

interface InfoRowGroupProps {
	children: ReactNode;
	className?: string;
}

export function InfoRowGroup({ children, className }: InfoRowGroupProps) {
	return (
		<div className={cn("divide-y divide-stroke-weak text-xs tracking-[0.5px]", className)} data-slot="info-row-group">
			{children}
		</div>
	);
}
