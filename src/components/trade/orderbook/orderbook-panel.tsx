import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
	const orderbookContainerRef = useRef<HTMLDivElement>(null);
	const visibleRows = useOrderbookRows(orderbookContainerRef);

	const { data: selectedMarket } = useSelectedMarketInfo();

	const { data: orderbook, status: orderbookStatus } = useSubL2Book(
		{
			coin: selectedMarket?.name ?? "",
			nSigFigs: selectedOption?.nSigFigs ?? 5,
			mantissa: selectedOption?.mantissa,
		},
		{ enabled: !!selectedMarket?.name },
	);

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
	const maxTotal = getMaxTotal(bids, asks);
	const spread = deferredOrderbook?.spread;
	const spreadPct = getPercent(spread, selectedMarket?.markPx);
	const priceGroupingOptions = getPriceGroupingOptions(selectedMarket?.markPx);

	const szDecimals = selectedMarket?.szDecimals ?? 4;

	const displayAsset = showOrderbookInQuote ? quoteToken : baseToken;
	const toggleAssetDisplay = () => setShowOrderbookInQuote(!showOrderbookInQuote);

	return (
		<Tabs defaultValue="book" className="h-full min-h-0 flex flex-col overflow-hidden border-l border-border/40">
			<div className="h-9 flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-surface/30">
				<TabsList>
					<TabsTrigger value="book" aria-label={t`Order Book`}>
						{t`Order Book`}
					</TabsTrigger>
					<TabsTrigger value="trades" aria-label={t`Recent Trades`}>
						{t`Trades`}
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="book" className="flex-1 min-h-0 flex flex-col">
				<div className="grid grid-cols-3 gap-2 px-2 h-9 items-center text-4xs uppercase tracking-wider border-b border-border/40 shrink-0">
					<div className="flex items-center gap-1">
						{t`Price`}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="px-1.5 text-4xs hover:bg-transparent inline-flex items-center gap-1"
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
					<Button
						variant="ghost"
						size="none"
						onClick={toggleAssetDisplay}
						className="text-right hover:text-fg hover:bg-transparent transition-colors inline-flex items-center justify-end gap-0.5"
					>
						{t`Size`}
						<span className="opacity-60">({displayAsset})</span>
						<ArrowsLeftRightIcon className="size-2 opacity-40" />
					</Button>
					<Button
						variant="ghost"
						size="none"
						onClick={toggleAssetDisplay}
						className="text-right hover:text-fg hover:bg-transparent transition-colors inline-flex items-center justify-end gap-0.5"
					>
						{t`Total`}
						<span className="opacity-60">({displayAsset})</span>
						<ArrowsLeftRightIcon className="size-2 opacity-40" />
					</Button>
				</div>

				<div ref={orderbookContainerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
					{orderbookStatus !== "error" && asks.length > 0 ? (
						<div className="flex-1 flex flex-col justify-end gap-px py-0.5">
							{[...asks].reverse().map((level, i) => (
								<OrderbookRow
									key={`ask-${level.price}-${i}`}
									level={level}
									side="ask"
									maxTotal={maxTotal}
									showInQuote={showOrderbookInQuote}
									szDecimals={szDecimals}
								/>
							))}
						</div>
					) : (
						<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-fg">
							{orderbookStatus === "error" ? t`Failed to load order book.` : t`Waiting for order book...`}
						</div>
					)}

					<div className="mt-auto shrink-0 px-2 py-1.5 border-y border-border/40 flex items-center justify-between text-4xs text-muted-fg">
						<span>{t`Spread`}</span>
						<span className="tabular-nums text-warning">
							{`${formatNumber(spread, 2)} (${formatNumber(spreadPct, 3)}%)`}
						</span>
					</div>

					{orderbookStatus !== "error" && bids.length > 0 && (
						<div className="flex-1 flex flex-col gap-px py-0.5">
							{bids.map((level, i) => (
								<OrderbookRow
									key={`bid-${level.price}-${i}`}
									level={level}
									side="bid"
									maxTotal={maxTotal}
									showInQuote={showOrderbookInQuote}
									szDecimals={szDecimals}
								/>
							))}
						</div>
					)}
				</div>
			</TabsContent>

			<TabsContent value="trades" className="flex-1 min-h-0 flex flex-col">
				<TradesPanel key={selectedMarket?.name} />
			</TabsContent>
		</Tabs>
	);
}
