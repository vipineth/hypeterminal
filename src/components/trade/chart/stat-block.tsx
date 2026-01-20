import { cn } from "@/lib/cn";

interface Props {
	label: string;
	value: string;
	valueClass?: string;
}

export function StatBlock({ label, value, valueClass }: Props) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-fg/70 uppercase">{label}</span>
			<span className={cn("tabular-nums font-medium", valueClass)}>{value}</span>
		</div>
	);
}
