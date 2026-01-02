import { FALLBACK_VALUE_PLACEHOLDER } from "@/constants/app";
import { formatNumber, formatUSD } from "@/lib/format";
import type { OrderBookRow } from "@/lib/trade/orderbook";
import { cn } from "@/lib/utils";
import { useSetSelectedPrice } from "@/stores/use-orderbook-actions-store";

type BookRowProps = {
	row: OrderBookRow;
	type: "ask" | "bid";
	maxTotal: number;
	/** Show size/total in USDC instead of asset */
	showInUsdc?: boolean;
	/** Decimal precision for token amounts (from market metadata) */
	szDecimals: number;
};

export function BookRow({ row, type, maxTotal, showInUsdc = false, szDecimals }: BookRowProps) {
	const setSelectedPrice = useSetSelectedPrice();
	const depthPct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
	const isAsk = type === "ask";

	// Use priceRaw string to preserve exact decimal precision from API
	const priceText = formatNumber(row.priceRaw);

	// Size and total can be shown in USDC (multiply by price) or in asset
	const sizeValue = showInUsdc ? row.size * row.price : row.size;
	const totalValue = showInUsdc ? row.total * row.price : row.total;

	const sizeText = Number.isFinite(sizeValue)
		? showInUsdc
			? formatUSD(sizeValue, { digits: 2, compact: true })
			: formatNumber(sizeValue, szDecimals)
		: FALLBACK_VALUE_PLACEHOLDER;
	const totalText = Number.isFinite(totalValue)
		? showInUsdc
			? formatUSD(totalValue, { digits: 2, compact: true })
			: formatNumber(totalValue, szDecimals)
		: FALLBACK_VALUE_PLACEHOLDER;

	const handlePriceClick = () => {
		if (Number.isFinite(row.price)) {
			setSelectedPrice(row.price);
		}
	};

	return (
		<div className="relative hover:bg-accent/30 cursor-pointer group">
			<div
				className={cn("absolute inset-y-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 px-2 relative z-10">
				<button
					type="button"
					onClick={handlePriceClick}
					className={cn("text-left hover:underline", isAsk ? "text-terminal-red" : "text-terminal-green")}
				>
					{priceText}
				</button>
				<div className="text-right text-muted-foreground group-hover:text-foreground">{sizeText}</div>
				<div className="text-right text-muted-foreground/70 group-hover:text-muted-foreground">{totalText}</div>
			</div>
		</div>
	);
}
