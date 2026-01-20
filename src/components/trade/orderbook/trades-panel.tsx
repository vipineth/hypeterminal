import { t } from "@lingui/core/macro";
import { ArrowRightLeft, ExternalLink } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRingBuffer } from "@/lib/circular-buffer";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useSelectedResolvedMarket, useSubTrades } from "@/lib/hyperliquid";
import { getExplorerTxUrl } from "@/lib/hyperliquid/explorer";
import { getTradeKey, type ProcessedTrade, processTrades, type RawTrade } from "@/lib/trade/trades";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";

const MAX_TRADES = 100;
const getKey = (t: RawTrade) => getTradeKey(t.hash, t.tid);
const compare = (a: RawTrade, b: RawTrade) => b.time - a.time;

interface Props {
	trade: ProcessedTrade;
	szDecimals: number;
	showInUsd: boolean;
}

const TradeRow = memo(function TradeRow({ trade, szDecimals, showInUsd }: Props) {
	const sizeDisplay = showInUsd ? formatNumber(trade.price * trade.size, 2) : formatNumber(trade.size, szDecimals);

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
			<div className="text-muted-fg/70 flex items-center gap-1">
				{trade.time}
				<ExternalLink className="size-2.5 opacity-100 hover:opacity-80" />
			</div>
			<div className={cn("text-right", trade.side === "buy" ? "text-positive" : "text-negative")}>
				{formatNumber(trade.price, 2)}
			</div>
			<div className="text-right text-muted-fg">{sizeDisplay}</div>
		</a>
	);
});

const RESOLVED_MARKET_OPTIONS = { ctxMode: "none" } as const;

export function TradesPanel() {
	const { data: selectedMarket } = useSelectedResolvedMarket(RESOLVED_MARKET_OPTIONS);
	const coin = selectedMarket.coin;
	const params = useMemo(() => ({ coin }), [coin]);
	const { data: tradesBatch, status, error } = useSubTrades(params);
	const { showOrderbookInUsd } = useGlobalSettings();
	const { setShowOrderbookInUsd } = useGlobalSettingsActions();

	const {
		items: trades,
		add,
		clear,
	} = useRingBuffer<RawTrade>({
		maxSize: MAX_TRADES,
		getKey,
		compare,
	});

	const lastBatchRef = useRef<RawTrade[] | undefined>(undefined);
	const lastCoinRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (coin !== lastCoinRef.current) {
			lastCoinRef.current = coin;
			lastBatchRef.current = undefined;
			clear();
		}
		if (tradesBatch?.length && tradesBatch !== lastBatchRef.current) {
			lastBatchRef.current = tradesBatch;
			add(tradesBatch);
		}
	}, [coin, tradesBatch, add, clear]);

	const szDecimals = selectedMarket.szDecimals;
	const processed = useMemo(() => processTrades(trades), [trades]);
	const toggleUsdDisplay = () => setShowOrderbookInUsd(!showOrderbookInUsd);

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-fg/70 border-b border-border/40">
				<div>{t`Time`}</div>
				<div className="text-right">{t`Price`}</div>
				<Button
					variant="ghost"
					size="none"
					onClick={toggleUsdDisplay}
					className="text-right hover:text-fg hover:bg-transparent transition-colors inline-flex items-center justify-end gap-0.5"
				>
					{t`Size`}
					<span className="opacity-60">({showOrderbookInUsd ? "$" : selectedMarket.coin})</span>
					<ArrowRightLeft className="size-2 opacity-40" />
				</Button>
			</div>

			{status === "error" ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-fg">
					{error instanceof Error ? error.message : t`Failed to load trades.`}
				</div>
			) : processed.length === 0 ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-fg">
					{t`Waiting for trades...`}
				</div>
			) : (
				<div className="flex-1 min-h-0 overflow-y-auto">
					<div className="px-2 py-1 space-y-px">
						{processed.map((trade) => (
							<TradeRow key={trade.id} trade={trade} szDecimals={szDecimals} showInUsd={showOrderbookInUsd} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
