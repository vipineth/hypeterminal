import { Button } from "@/components/ui/button";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatNumber, formatUSD } from "@/lib/format";
import type { BookLevel } from "@/lib/trade/orderbook";
import { useOrderbookActions } from "@/stores/use-orderbook-actions-store";

interface Props {
	level: BookLevel;
	side: "ask" | "bid";
	maxTotal: number;
	showInUsd?: boolean;
	szDecimals: number;
}

export function OrderbookRow({ level, side, maxTotal, showInUsd = false, szDecimals }: Props) {
	const { setSelectedPrice } = useOrderbookActions();
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
				<Button
					variant="link"
					size="none"
					onClick={() => setSelectedPrice(level.price)}
					className={cn(
						"text-left justify-start",
						isAsk ? "text-negative hover:text-negative" : "text-positive hover:text-positive",
					)}
				>
					{formatNumber(level.price)}
				</Button>
				<div className="text-right text-muted-fg group-hover:text-fg">{sizeText}</div>
				<div className="text-right text-muted-fg/70 group-hover:text-muted-fg">{totalText}</div>
			</div>
		</div>
	);
}
