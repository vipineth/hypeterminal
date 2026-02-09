import { cn } from "@/lib/cn";

interface Props {
	label: string;
	value: string;
	valueClass?: string;
}

export function StatBlock({ label, value, valueClass }: Props) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-text-500 uppercase tracking-tight">{label}</span>
			<span className={cn("tabular-nums text-text-950", valueClass)}>{value}</span>
		</div>
	);
}
