import { t } from "@lingui/core/macro";
import { ExternalLink } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { useRingBuffer } from "@/lib/circular-buffer";
import { formatNumber } from "@/lib/format";
import { useSubTrades } from "@/lib/hl-react";
import { getExplorerTxUrl } from "@/lib/hyperliquid/explorer";
import { getTradeKey, processTrades, type ProcessedTrade, type RawTrade } from "@/lib/trade/trades";
import { cn } from "@/lib/utils";

const MAX_TRADES = 100;
const getKey = (t: RawTrade) => getTradeKey(t.hash, t.tid);
const compare = (a: RawTrade, b: RawTrade) => b.time - a.time;

type TradeRowProps = {
	trade: ProcessedTrade;
	szDecimals: number;
};

const TradeRow = memo(function TradeRow({ trade, szDecimals }: TradeRowProps) {
	return (
		<a
			href={getExplorerTxUrl(trade.hash)}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 hover:bg-accent/30 group",
				trade.side === "buy" ? "trade-row-buy" : "trade-row-sell",
			)}
		>
			<div className="text-muted-foreground/70 flex items-center gap-1">
				{trade.time}
				<ExternalLink className="size-2.5 opacity-100 hover:opacity-80" />
			</div>
			<div className={cn("text-right", trade.side === "buy" ? "text-terminal-green" : "text-terminal-red")}>
				{formatNumber(trade.price, 2)}
			</div>
			<div className="text-right text-muted-foreground">{formatNumber(trade.size, szDecimals)}</div>
		</a>
	);
});

export function TradesView() {
	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });
	const { data: tradesBatch, status, error } = useSubTrades({ coin: selectedMarket.coin });

	const { items: trades, add } = useRingBuffer<RawTrade>({
		maxSize: MAX_TRADES,
		getKey,
		compare,
	});

	const lastBatchRef = useRef<RawTrade[] | undefined>(undefined);

	useEffect(() => {
		if (tradesBatch?.length && tradesBatch !== lastBatchRef.current) {
			lastBatchRef.current = tradesBatch;
			add(tradesBatch);
		}
	}, [tradesBatch, add]);

	const szDecimals = selectedMarket.szDecimals;
	const processed = useMemo(() => processTrades(trades), [trades]);

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
				<div>{t`Time`}</div>
				<div className="text-right">{t`Price`}</div>
				<div className="text-right">{t`Size`}</div>
			</div>

			{status === "error" ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
					{error instanceof Error ? error.message : t`Failed to load trades.`}
				</div>
			) : processed.length === 0 ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
					{t`Waiting for trades...`}
				</div>
			) : (
				<ScrollArea className="flex-1 min-h-0">
					<div className="px-2 py-1 space-y-px">
						{processed.map((trade) => (
							<TradeRow key={trade.id} trade={trade} szDecimals={szDecimals} />
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
}
