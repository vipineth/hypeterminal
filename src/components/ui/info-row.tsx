import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
	label: ReactNode;
	value: ReactNode;
	valueClassName?: string;
}

export function InfoRow({ label, value, valueClassName }: Props) {
	return (
		<div className="flex items-center justify-between px-2 py-1.5">
			<span className="text-text-600">{label}</span>
			<span className={cn("tabular-nums text-text-950", valueClassName)}>{value}</span>
		</div>
	);
}
