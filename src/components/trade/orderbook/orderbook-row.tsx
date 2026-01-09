import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { formatNumber, formatUSD } from "@/lib/format";
import type { BookLevel } from "@/lib/trade/orderbook";
import { cn } from "@/lib/utils";
import { useSetSelectedPrice } from "@/stores/use-orderbook-actions-store";

interface Props {
	level: BookLevel;
	side: "ask" | "bid";
	maxTotal: number;
	showInUsd?: boolean;
	szDecimals: number;
}

export function OrderbookRow({ level, side, maxTotal, showInUsd = false, szDecimals }: Props) {
	const setSelectedPrice = useSetSelectedPrice();
	const depthPct = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
	const isAsk = side === "ask";

	const sizeValue = showInUsd ? level.size * level.price : level.size;
	const totalValue = showInUsd ? level.total * level.price : level.total;

	const sizeText = Number.isFinite(sizeValue)
		? showInUsd
			? formatUSD(sizeValue, { digits: 2, compact: true })
			: formatNumber(sizeValue, szDecimals)
		: FALLBACK_VALUE_PLACEHOLDER;

	const totalText = Number.isFinite(totalValue)
		? showInUsd
			? formatUSD(totalValue, { digits: 2, compact: true })
			: formatNumber(totalValue, szDecimals)
		: FALLBACK_VALUE_PLACEHOLDER;

	return (
		<div className="relative hover:bg-accent/30 cursor-pointer group">
			<div
				className={cn("absolute inset-y-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 px-2 relative z-10">
				<button
					type="button"
					onClick={() => setSelectedPrice(level.price)}
					className={cn("text-left hover:underline", isAsk ? "text-terminal-red" : "text-terminal-green")}
				>
					{formatNumber(level.price)}
				</button>
				<div className="text-right text-muted-foreground group-hover:text-foreground">{sizeText}</div>
				<div className="text-right text-muted-foreground/70 group-hover:text-muted-foreground">{totalText}</div>
			</div>
		</div>
	);
}
