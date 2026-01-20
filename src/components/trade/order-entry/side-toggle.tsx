import { t } from "@lingui/core/macro";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Side } from "@/lib/trade/types";

interface Props {
	side: Side;
	onSideChange: (side: Side) => void;
}

export function SideToggle({ side, onSideChange }: Props) {
	return (
		<div className="grid grid-cols-2 gap-1">
			<Button
				variant="ghost"
				size="none"
				onClick={() => onSideChange("buy")}
				className={cn(
					"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
					side === "buy"
						? "bg-positive/20 border-positive text-positive"
						: "border-border/60 text-muted-fg hover:border-positive/40 hover:text-positive",
				)}
				aria-label={t`Buy Long`}
			>
				<TrendingUp className="size-3 inline mr-1" />
				{t`Long`}
			</Button>
			<Button
				variant="ghost"
				size="none"
				onClick={() => onSideChange("sell")}
				className={cn(
					"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
					side === "sell"
						? "bg-negative/20 border-negative text-negative"
						: "border-border/60 text-muted-fg hover:border-negative/40 hover:text-negative",
				)}
				aria-label={t`Sell Short`}
			>
				<TrendingDown className="size-3 inline mr-1" />
				{t`Short`}
			</Button>
		</div>
	);
}
