import { cn } from "@/lib/cn";

interface Props {
	label: string;
	value: string;
	valueClass?: string;
}

export function StatBlock({ label, value, valueClass }: Props) {
	return (
		<div className="flex items-center gap-1">
			<span className="text-2xs text-text-weak uppercase tracking-tight">{label}</span>
			<span className={cn("tabular-nums font-medium text-text-strong", valueClass)}>{value}</span>
		</div>
	);
}
