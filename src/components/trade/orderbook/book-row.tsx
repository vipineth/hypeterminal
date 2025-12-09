import { cn } from "@/lib/utils";
import type { OrderBookRow } from "../lib";

type BookRowProps = {
	row: OrderBookRow;
	type: "ask" | "bid";
	maxTotal: number;
};

export function BookRow({ row, type, maxTotal }: BookRowProps) {
	const depthPct = (row.total / maxTotal) * 100;
	const isAsk = type === "ask";

	return (
		<div className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 relative hover:bg-accent/30 cursor-pointer group">
			<div
				className={cn("absolute inset-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className={cn("relative z-10", isAsk ? "text-terminal-red" : "text-terminal-green")}>
				{row.price.toFixed(2)}
			</div>
			<div className="text-right relative z-10 text-muted-foreground group-hover:text-foreground">
				{row.size.toFixed(3)}
			</div>
			<div className="text-right relative z-10 text-muted-foreground/70 group-hover:text-muted-foreground">
				{row.total.toFixed(3)}
			</div>
		</div>
	);
}
