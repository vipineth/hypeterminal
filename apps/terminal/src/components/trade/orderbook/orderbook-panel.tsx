import { Dropdown, SegmentedControlItem, SegmentedControls } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { BookBookmarkIcon, ListDashesIcon } from "@phosphor-icons/react";
import { useDeferredValue, useMemo, useState } from "react";
import { getBaseQuoteFromPairName, getPercent } from "@/domain/market";
import { formatNumber } from "@/lib/format";
import { useSelectedMarketInfo, useSubscription } from "@/lib/hyperliquid";
import { toNumber } from "@/lib/trade/numbers";
import {
	getMaxTotal,
	getPriceGroupingOptions,
	type L2BookPriceGroupOption,
	processLevels,
} from "@/lib/trade/orderbook";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { OrderbookRow } from "./orderbook-row";
import { TradesPanel } from "./trades-panel";
import { useOrderbookRows } from "./use-orderbook-rows";

export function OrderbookPanel() {
	const [selectedOption, setSelectedOption] = useState<L2BookPriceGroupOption | null>(null);
	const { showOrderbookInQuote } = useGlobalSettings();
	const { setShowOrderbookInQuote } = useGlobalSettingsActions();
	const [visibleRows, orderbookContainerRef] = useOrderbookRows();
	const [tab, setTab] = useState("book");

	const { data: selectedMarket } = useSelectedMarketInfo();
	const subscriptionParams = useMemo(
		() => ({
			coin: selectedMarket?.name ?? "",
			nSigFigs: selectedOption?.nSigFigs ?? 5,
			mantissa: selectedOption?.mantissa,
		}),
		[selectedMarket?.name, selectedOption?.mantissa, selectedOption?.nSigFigs],
	);

	const { data: orderbook, status: orderbookStatus } = useSubscription("l2Book", subscriptionParams, {
		enabled: !!selectedMarket?.name,
	});

	const deferredOrderbook = useDeferredValue(orderbook);

	const { baseToken, quoteToken } = useMemo(() => {
		if (!selectedMarket) return { baseToken: "", quoteToken: "" };
		return getBaseQuoteFromPairName(selectedMarket.pairName, selectedMarket.kind);
	}, [selectedMarket]);

	const bids = useMemo(
		() => processLevels(deferredOrderbook?.levels[0], visibleRows),
		[deferredOrderbook?.levels, visibleRows],
	);
	const asks = useMemo(
		() => processLevels(deferredOrderbook?.levels[1], visibleRows),
		[deferredOrderbook?.levels, visibleRows],
	);
	const asksReversed = useMemo(() => {
		const reversed = new Array(asks.length);
		for (let i = 0; i < asks.length; i += 1) {
			reversed[i] = asks[asks.length - 1 - i];
		}
		return reversed;
	}, [asks]);
	const maxTotal = useMemo(() => getMaxTotal(bids, asks), [asks, bids]);
	const spread = deferredOrderbook?.spread;
	const spreadPct = getPercent(spread, selectedMarket?.markPx);
	const markPx = toNumber(selectedMarket?.markPx);
	const priceGroupingOptions = useMemo(() => getPriceGroupingOptions(markPx ?? undefined), [markPx]);

	const szDecimals = selectedMarket?.szDecimals ?? 4;

	const displayAsset = showOrderbookInQuote ? quoteToken : baseToken;
	const toggleAssetDisplay = () => setShowOrderbookInQuote(!showOrderbookInQuote);

	const hasData = orderbookStatus !== "error";

	const dropdownItems = priceGroupingOptions.map((option) => ({
		label: option.label,
		onSelect: () => setSelectedOption(option),
	}));

	return (
		<div className="h-full min-h-0 flex flex-col overflow-hidden bg-bg-raised">
			<div className="flex items-center justify-between px-1.5 py-1.5">
				<SegmentedControls value={tab} onValueChange={setTab}>
					<SegmentedControlItem value="book" aria-label={t`Order Book`}>
						<BookBookmarkIcon className="size-3.5" />
						{t`Order Book`}
					</SegmentedControlItem>
					<SegmentedControlItem value="trades" aria-label={t`Recent Trades`}>
						<ListDashesIcon className="size-3.5" />
						{t`Trades`}
					</SegmentedControlItem>
				</SegmentedControls>
			</div>

			{tab === "book" && (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-1 px-2 py-1.5 items-center text-2xs text-text-strong uppercase tracking-wider border-b border-stroke-weak/40 shrink-0">
						<div className="min-w-0 flex items-center gap-1">
							{t`Price`}
							<Dropdown
								trigger={
									<span className="text-2xs tabular-nums">
										{selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
									</span>
								}
								items={dropdownItems}
								size="sm"
								align="start"
							/>
						</div>
						<button
							className="min-w-0 inline-flex items-center justify-end gap-0.5 hover:text-text-strong truncate"
							type="button"
							onClick={toggleAssetDisplay}
						>
							{t`Size`}
							<span className="text-text-strong truncate">({displayAsset})</span>
						</button>
						<button
							className="min-w-0 inline-flex items-center justify-end gap-0.5 hover:text-text-strong truncate"
							type="button"
							onClick={toggleAssetDisplay}
						>
							{t`Total`}
							<span className="text-text-strong truncate">({displayAsset})</span>
						</button>
					</div>

					<div ref={orderbookContainerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
						<div className="flex-1 min-h-0 flex flex-col justify-end">
							{hasData && asks.length > 0 ? (
								asksReversed.map((level) => (
									<OrderbookRow
										key={`ask-${level.price}`}
										level={level}
										side="ask"
										maxTotal={maxTotal}
										showInQuote={showOrderbookInQuote}
										szDecimals={szDecimals}
									/>
								))
							) : (
								<div className="flex items-center justify-center px-2 py-6 text-xs text-text-strong">
									{orderbookStatus === "error" ? t`Failed to load order book.` : t`Waiting for order book...`}
								</div>
							)}
						</div>

						<div
							data-slot="orderbook-spread"
							className="shrink-0 px-2 py-1.5 border-y border-stroke-weak/40 flex items-center justify-between text-xs text-text-strong"
						>
							<span>{t`Spread`}</span>
							<span className="tabular-nums font-medium text-text-weak">
								{`${formatNumber(spread, 2)} (${formatNumber(spreadPct, 3)}%)`}
							</span>
						</div>

						<div className="flex-1 min-h-0 flex flex-col">
							{hasData &&
								bids.map((level) => (
									<OrderbookRow
										key={`bid-${level.price}`}
										level={level}
										side="bid"
										maxTotal={maxTotal}
										showInQuote={showOrderbookInQuote}
										szDecimals={szDecimals}
									/>
								))}
						</div>
					</div>
				</div>
			)}

			{tab === "trades" && (
				<div className="flex-1 min-h-0 flex flex-col">
					<TradesPanel key={selectedMarket?.name} />
				</div>
			)}
		</div>
	);
}
