import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { memo, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getBaseQuoteFromDisplayName } from "@/domain/market";
import { useRingBuffer } from "@/lib/circular-buffer";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useSelectedMarketInfo, useSubTrades } from "@/lib/hyperliquid";
import { getExplorerTxUrl } from "@/lib/hyperliquid/explorer";
import { getTradeKey, type ProcessedTrade, processTrades, type RawTrade } from "@/lib/trade/trades";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";

const MAX_TRADES = 100;
const getKey = (t: RawTrade) => getTradeKey(t.hash, t.tid);
const compare = (a: RawTrade, b: RawTrade) => b.time - a.time;

interface Props {
	trade: ProcessedTrade;
	szDecimals: number;
	showInQuote: boolean;
}

const TradeRow = memo(function TradeRow({ trade, szDecimals, showInQuote }: Props) {
	const sizeDisplay = showInQuote ? formatNumber(trade.price * trade.size, 2) : formatNumber(trade.size, szDecimals);

	return (
		<a
			href={getExplorerTxUrl(trade.hash)}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"grid grid-cols-3 gap-2 text-3xs tabular-nums py-0.5 hover:bg-surface-analysis/30 group",
				trade.side === "buy" ? "trade-row-buy" : "trade-row-sell",
			)}
		>
			<div className="text-text-500 flex items-center gap-1">
				{trade.time}
				<ArrowSquareOutIcon className="size-2.5 opacity-100 hover:opacity-80" />
			</div>
			<div
				className={cn("text-right font-medium", trade.side === "buy" ? "text-market-up-500" : "text-market-down-500")}
			>
				{formatNumber(trade.price, 2)}
			</div>
			<div className="text-right text-text-950">{sizeDisplay}</div>
		</a>
	);
});

export function TradesPanel() {
	const { data: selectedMarket } = useSelectedMarketInfo();
	const subscriptionCoin = selectedMarket?.name ?? "";
	const params = useMemo(() => ({ coin: subscriptionCoin }), [subscriptionCoin]);
	const {
		data: tradesBatch,
		status,
		error,
	} = useSubTrades(params, {
		enabled: !!selectedMarket && !!subscriptionCoin,
	});
	const { showOrderbookInQuote } = useGlobalSettings();
	const { setShowOrderbookInQuote } = useGlobalSettingsActions();

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
		if (subscriptionCoin !== lastCoinRef.current) {
			lastCoinRef.current = subscriptionCoin;
			lastBatchRef.current = undefined;
			clear();
		}
		if (tradesBatch?.length && tradesBatch !== lastBatchRef.current) {
			lastBatchRef.current = tradesBatch;
			add(tradesBatch);
		}
	}, [subscriptionCoin, tradesBatch, add, clear]);

	const { baseToken, quoteToken } = useMemo(() => {
		if (!selectedMarket) return { baseToken: "", quoteToken: "" };
		return getBaseQuoteFromDisplayName(selectedMarket.displayName, selectedMarket.kind);
	}, [selectedMarket]);

	const szDecimals = selectedMarket?.szDecimals ?? 4;
	const processed = useMemo(() => processTrades(trades), [trades]);
	const displayAsset = showOrderbookInQuote ? quoteToken : baseToken;
	const toggleAssetDisplay = () => setShowOrderbookInQuote(!showOrderbookInQuote);

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="grid grid-cols-3 gap-2 px-2 py-1 h-9 items-center text-3xs text-text-950 uppercase tracking-wider border-b border-border-200/40">
				<div>{t`Time`}</div>
				<div className="text-right">{t`Price`}</div>
				<Button
					variant="text"
					size="none"
					onClick={toggleAssetDisplay}
					className="text-right hover:text-text-950 hover:bg-transparent transition-colors inline-flex items-center justify-end gap-0.5"
				>
					{t`Size`}
					<span className="text-text-500">({displayAsset})</span>
					<ArrowsLeftRightIcon className="size-2 opacity-40" />
				</Button>
			</div>

			{status === "error" ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-text-600">
					{error instanceof Error ? error.message : t`Failed to load trades.`}
				</div>
			) : processed.length === 0 ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-text-600">
					{t`Waiting for trades...`}
				</div>
			) : (
				<div className="flex-1 min-h-0 overflow-y-auto">
					<div className="px-2 py-1 space-y-px">
						{processed.map((trade) => (
							<TradeRow key={trade.id} trade={trade} szDecimals={szDecimals} showInQuote={showOrderbookInQuote} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
