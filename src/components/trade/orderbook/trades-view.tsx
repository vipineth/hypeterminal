import { t } from "@lingui/core/macro";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HyperliquidWsEvent } from "@/hooks/hyperliquid/socket/use-hyperliquid-ws";
import { useTradesSubscription } from "@/hooks/hyperliquid/socket/use-trades-subscription";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { formatNumber } from "@/lib/format";
import { getExplorerTxUrl } from "@/lib/hyperliquid/explorer";
import { parseNumber } from "@/lib/trade/numbers";
import { getTradeKey } from "@/lib/trade/trades";
import { cn } from "@/lib/utils";

type Trade = HyperliquidWsEvent<"trades">[number];

export function TradesView() {
	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });
	const coin = selectedMarket?.coin ?? "BTC";
	const szDecimals = selectedMarket?.szDecimals ?? 4;
	const { data: tradesBatch, status, error } = useTradesSubscription({ params: { coin } });
	const [trades, setTrades] = useState<Trade[]>([]);

	useEffect(() => {
		if (!tradesBatch || tradesBatch.length === 0) return;

		setTrades((prev) => {
			const merged = [...tradesBatch, ...prev];
			const seen = new Set<string>();
			const deduped: Trade[] = [];
			for (const t of merged) {
				const key = getTradeKey(t.hash, t.tid);
				if (seen.has(key)) continue;
				seen.add(key);
				deduped.push(t);
			}
			deduped.sort((a, b) => b.time - a.time);
			return deduped.slice(0, 30);
		});
	}, [tradesBatch]);

	const tradeRows = useMemo(() => {
		return trades.map((trade) => {
			const time = new Date(trade.time).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});

			const price = parseNumber(trade.px);
			const size = parseNumber(trade.sz);

			return {
				id: getTradeKey(trade.hash, trade.tid),
				hash: trade.hash,
				time,
				price: Number.isFinite(price) ? formatNumber(price, 2) : String(trade.px),
				size: Number.isFinite(size) ? formatNumber(size, szDecimals) : String(trade.sz),
				side: trade.side === "B" ? ("buy" as const) : ("sell" as const),
			};
		});
	}, [trades, szDecimals]);

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
				<div>{t`Time`}</div>
				<div className="text-right">{t`Price`}</div>
				<div className="text-right">{t`Size`}</div>
			</div>
			{tradeRows.length === 0 ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
					{status === "error" ? t`Failed to load trades.` : t`Waiting for trades...`}
				</div>
			) : (
				<ScrollArea className="flex-1 min-h-0">
					<div className="px-2 py-1 space-y-px">
						{tradeRows.map((t) => (
							<a
								key={t.id}
								href={getExplorerTxUrl(t.hash)}
								target="_blank"
								rel="noopener noreferrer"
								className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 hover:bg-accent/30 group"
							>
								<div className="text-muted-foreground/70 flex items-center gap-1">
									{t.time}
									<ExternalLink className="size-2.5 opacity-100 hover:opacity-80" />
								</div>
								<div className={cn("text-right", t.side === "buy" ? "text-terminal-green" : "text-terminal-red")}>
									{t.price}
								</div>
								<div className="text-right text-muted-foreground">{t.size}</div>
							</a>
						))}
					</div>
				</ScrollArea>
			)}
			{status === "error" ? (
				<div className="shrink-0 px-2 pb-1.5 text-4xs text-terminal-red/80">
					{error instanceof Error ? error.message : t`WebSocket error`}
				</div>
			) : null}
		</div>
	);
}
