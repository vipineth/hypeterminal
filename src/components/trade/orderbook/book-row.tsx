import { FALLBACK_VALUE_PLACEHOLDER } from "@/constants/app";
import { formatNumber } from "@/lib/format";
import type { OrderBookRow } from "@/lib/trade/orderbook";
import { cn } from "@/lib/utils";

type BookRowProps = {
	row: OrderBookRow;
	type: "ask" | "bid";
	maxTotal: number;
};

export function BookRow({ row, type, maxTotal }: BookRowProps) {
	const depthPct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
	const isAsk = type === "ask";

	const priceText = Number.isFinite(row.price) ? formatNumber(row.price, 2) : FALLBACK_VALUE_PLACEHOLDER;
	const sizeText = Number.isFinite(row.size) ? formatNumber(row.size, 3) : FALLBACK_VALUE_PLACEHOLDER;
	const totalText = Number.isFinite(row.total) ? formatNumber(row.total, 3) : FALLBACK_VALUE_PLACEHOLDER;

	return (
		<div className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 relative hover:bg-accent/30 cursor-pointer group">
			<div
				className={cn("absolute inset-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className={cn("relative z-10", isAsk ? "text-terminal-red" : "text-terminal-green")}>{priceText}</div>
			<div className="text-right relative z-10 text-muted-foreground group-hover:text-foreground">{sizeText}</div>
			<div className="text-right relative z-10 text-muted-foreground/70 group-hover:text-muted-foreground">
				{totalText}
			</div>
		</div>
	);
}
