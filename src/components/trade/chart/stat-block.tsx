import { cn } from "@/lib/utils";

type StatBlockProps = {
	label: string;
	value: string;
	valueClass?: string;
};

export function StatBlock({ label, value, valueClass }: StatBlockProps) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground/70 uppercase">{label}</span>
			<span className={cn("tabular-nums font-medium", valueClass)}>{value}</span>
		</div>
	);
}

