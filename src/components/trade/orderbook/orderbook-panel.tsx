import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, BookBookmarkIcon, CaretDownIcon, ListDashesIcon } from "@phosphor-icons/react";
import { useDeferredValue, useMemo, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBaseQuoteFromDisplayName, getPercent } from "@/domain/market";
import { formatNumber } from "@/lib/format";
import { useSelectedMarketInfo, useSubL2Book } from "@/lib/hyperliquid";
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

	const { data: selectedMarket } = useSelectedMarketInfo();
	const subscriptionParams = useMemo(
		() => ({
			coin: selectedMarket?.name ?? "",
			nSigFigs: selectedOption?.nSigFigs ?? 5,
			mantissa: selectedOption?.mantissa,
		}),
		[selectedMarket?.name, selectedOption?.mantissa, selectedOption?.nSigFigs],
	);

	const { data: orderbook, status: orderbookStatus } = useSubL2Book(subscriptionParams, {
		enabled: !!selectedMarket?.name,
	});

	const deferredOrderbook = useDeferredValue(orderbook);

	const { baseToken, quoteToken } = useMemo(() => {
		if (!selectedMarket) return { baseToken: "", quoteToken: "" };
		return getBaseQuoteFromDisplayName(selectedMarket.displayName, selectedMarket.kind);
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
	const priceGroupingOptions = useMemo(() => getPriceGroupingOptions(selectedMarket?.markPx), [selectedMarket?.markPx]);

	const szDecimals = selectedMarket?.szDecimals ?? 4;

	const displayAsset = showOrderbookInQuote ? quoteToken : baseToken;
	const toggleAssetDisplay = () => setShowOrderbookInQuote(!showOrderbookInQuote);

	const hasData = orderbookStatus !== "error";

	return (
		<Tabs defaultValue="book" className="h-full min-h-0 flex flex-col overflow-hidden bg-surface-analysis">
			<div className="flex items-center justify-between px-1.5 py-1.5">
				<TabsList>
					<TabsTrigger value="book" aria-label={t`Order Book`}>
						<BookBookmarkIcon className="size-3.5" />
						{t`Order Book`}
					</TabsTrigger>
					<TabsTrigger value="trades" aria-label={t`Recent Trades`}>
						<ListDashesIcon className="size-3.5" />
						{t`Trades`}
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="book" className="flex-1 min-h-0 flex flex-col">
				<div className="grid grid-cols-3 gap-2 px-2 py-1.5 items-center text-3xs text-text-950 uppercase tracking-wider border-b border-border-200/40 shrink-0">
					<div className="flex items-center gap-1">
						{t`Price`}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="px-1.5 text-3xs hover:bg-transparent inline-flex items-center gap-1"
									aria-label={t`Select order book aggregation`}
								>
									{selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
									<CaretDownIcon className="size-2.5" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-20 font-mono text-xs">
								{priceGroupingOptions.map((option) => (
									<DropdownMenuItem
										key={`${option.nSigFigs}-${option.mantissa}`}
										onClick={() => setSelectedOption(option)}
										selected={
											selectedOption?.nSigFigs === option.nSigFigs && selectedOption?.mantissa === option.mantissa
										}
									>
										{option.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<button
						className="inline-flex items-center justify-end gap-0.5 hover:text-text-950"
						type="button"
						onClick={toggleAssetDisplay}
					>
						{t`Size`}
						<span className="text-text-950">({displayAsset})</span>
						<ArrowsLeftRightIcon className="size-2 opacity-40" />
					</button>
					<button
						className="inline-flex items-center justify-end gap-0.5 hover:text-text-950"
						type="button"
						onClick={toggleAssetDisplay}
					>
						{t`Total`}
						<span className="text-text-950">({displayAsset})</span>
						<ArrowsLeftRightIcon className="size-2 opacity-40" />
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
							<div className="flex items-center justify-center px-2 py-6 text-3xs text-text-950">
								{orderbookStatus === "error" ? t`Failed to load order book.` : t`Waiting for order book...`}
							</div>
						)}
					</div>

					<div
						data-slot="orderbook-spread"
						className="shrink-0 px-2 py-1.5 border-y border-border-200/40 flex items-center justify-between text-3xs text-text-950"
					>
						<span>{t`Spread`}</span>
						<span className="tabular-nums font-medium text-market-down-600">
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
			</TabsContent>

			<TabsContent value="trades" className="flex-1 min-h-0 flex flex-col">
				<TradesPanel key={selectedMarket?.name} />
			</TabsContent>
		</Tabs>
	);
}
