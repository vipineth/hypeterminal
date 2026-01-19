import { t } from "@lingui/core/macro";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Side } from "@/stores/use-order-entry-store";

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
						? "bg-terminal-green/20 border-terminal-green text-terminal-green terminal-glow-green"
						: "border-border/60 text-muted-foreground hover:border-terminal-green/40 hover:text-terminal-green",
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
						? "bg-terminal-red/20 border-terminal-red text-terminal-red terminal-glow-red"
						: "border-border/60 text-muted-foreground hover:border-terminal-red/40 hover:text-terminal-red",
				)}
				aria-label={t`Sell Short`}
			>
				<TrendingDown className="size-3 inline mr-1" />
				{t`Short`}
			</Button>
		</div>
	);
}
