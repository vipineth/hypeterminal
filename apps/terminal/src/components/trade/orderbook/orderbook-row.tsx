import { memo } from "react";
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
	const sizeText = formatNumber(sizeValue, { decimals: displayDecimals, compact: true });
	const totalText = formatNumber(totalValue, { decimals: displayDecimals, compact: true });

	return (
		<div className="relative hover:bg-fill-hover cursor-pointer group">
			<div
				className={cn("absolute inset-y-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className="grid grid-cols-3 gap-1 text-2xs tabular-nums py-0.5 px-2 relative z-10">
				<button
					type="button"
					onClick={() => setSelectedPrice(level.price)}
					className={cn(
						"text-left justify-start font-medium",
						isAsk ? "text-text-error hover:text-text-error" : "text-text-success hover:text-text-success",
					)}
				>
					{formatNumber(level.price)}
				</button>
				<div className="text-right text-text-strong group-hover:text-text-strong">{sizeText}</div>
				<div className="text-right text-text-strong group-hover:text-text-strong">{totalText}</div>
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
