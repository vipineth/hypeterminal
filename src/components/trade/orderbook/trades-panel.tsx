import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getBaseQuoteFromPairName } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useSelectedMarketInfo, useSubTrades } from "@/lib/hyperliquid";
import { getExplorerTxUrl } from "@/lib/hyperliquid/explorer";
import { type ProcessedTrade, processTrades } from "@/lib/trade/trades";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";

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
			<div className="text-text-950 flex items-center gap-1">
				{trade.time}
				<ArrowSquareOutIcon className="size-2.5 opacity-100 hover:opacity-80" />
			</div>
			<div
				className={cn("text-right font-medium", trade.side === "buy" ? "text-market-up-600" : "text-market-down-600")}
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
		data: trades,
		status,
		error,
	} = useSubTrades(params, {
		enabled: !!selectedMarket && !!subscriptionCoin,
	});
	const { showOrderbookInQuote } = useGlobalSettings();
	const { setShowOrderbookInQuote } = useGlobalSettingsActions();

	const { baseToken, quoteToken } = useMemo(() => {
		if (!selectedMarket) return { baseToken: "", quoteToken: "" };
		return getBaseQuoteFromPairName(selectedMarket.pairName, selectedMarket.kind);
	}, [selectedMarket]);

	const szDecimals = selectedMarket?.szDecimals ?? 4;
	const processed = useMemo(() => processTrades(trades ?? []), [trades]);
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
					<span className="text-text-950">({displayAsset})</span>
					<ArrowsLeftRightIcon className="size-2 opacity-40" />
				</Button>
			</div>

			{status === "error" ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-text-950">
					{error instanceof Error ? error.message : t`Failed to load trades.`}
				</div>
			) : processed.length === 0 ? (
				<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-text-950">
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
