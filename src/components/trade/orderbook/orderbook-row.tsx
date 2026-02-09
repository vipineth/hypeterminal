import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { BookLevel } from "@/lib/trade/orderbook";
import { useOrderbookActions } from "@/stores/use-orderbook-actions-store";

interface Props {
	level: BookLevel;
	side: "ask" | "bid";
	maxTotal: number;
	showInQuote?: boolean;
	szDecimals: number;
}

function OrderbookRowComponent({ level, side, maxTotal, showInQuote = false, szDecimals }: Props) {
	const { setSelectedPrice } = useOrderbookActions();
	const depthPct = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
	const isAsk = side === "ask";

	const sizeValue = showInQuote ? level.size * level.price : level.size;
	const totalValue = showInQuote ? level.total * level.price : level.total;

	const displayDecimals = showInQuote ? 2 : szDecimals;
	const sizeText = formatNumber(sizeValue, { digits: displayDecimals, compact: true });
	const totalText = formatNumber(totalValue, { digits: displayDecimals, compact: true });

	return (
		<div className="relative hover:bg-surface-analysis/30 cursor-pointer group">
			<div
				className={cn("absolute inset-y-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className="grid grid-cols-3 gap-2 text-3xs tabular-nums py-0.5 px-2 relative z-10">
				<Button
					variant="text"
					size="none"
					onClick={() => setSelectedPrice(level.price)}
					className={cn(
						"text-left justify-start font-medium",
						isAsk ? "text-market-down-600 hover:text-market-down-600" : "text-market-up-600 hover:text-market-up-600",
					)}
				>
					{formatNumber(level.price)}
				</Button>
				<div className="text-right text-text-950 group-hover:text-text-950">{sizeText}</div>
				<div className="text-right text-text-950 group-hover:text-text-950">{totalText}</div>
			</div>
		</div>
	);
}

function areEqual(prev: Props, next: Props): boolean {
	return (
		prev.side === next.side &&
		prev.maxTotal === next.maxTotal &&
		prev.showInQuote === next.showInQuote &&
		prev.szDecimals === next.szDecimals &&
		prev.level.price === next.level.price &&
		prev.level.size === next.level.size &&
		prev.level.total === next.level.total
	);
}

export const OrderbookRow = memo(OrderbookRowComponent, areEqual);
