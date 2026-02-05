import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Side } from "@/lib/trade/types";

interface SideLabels {
	buy: string;
	sell: string;
	buyAria: string;
	sellAria: string;
}

interface Props {
	side: Side;
	onSideChange: (side: Side) => void;
	labels: SideLabels;
}

export function SideToggle({ side, onSideChange, labels }: Props) {
	return (
		<div className="grid grid-cols-2 gap-1">
			<Button
				variant="text"
				size="none"
				onClick={() => onSideChange("buy")}
				className={cn(
					"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
					side === "buy"
						? "bg-positive/20 border-positive text-positive"
						: "border-border/60 text-muted-fg hover:border-positive/40 hover:text-positive",
				)}
				aria-label={labels.buyAria}
			>
				<TrendUpIcon className="size-3 inline mr-1" />
				{labels.buy}
			</Button>
			<Button
				variant="text"
				size="none"
				onClick={() => onSideChange("sell")}
				className={cn(
					"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
					side === "sell"
						? "bg-negative/20 border-negative text-negative"
						: "border-border/60 text-muted-fg hover:border-negative/40 hover:text-negative",
				)}
				aria-label={labels.sellAria}
			>
				<TrendDownIcon className="size-3 inline mr-1" />
				{labels.sell}
			</Button>
		</div>
	);
}
