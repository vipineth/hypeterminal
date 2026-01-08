import { t } from "@lingui/core/macro";
import { ArrowRightLeft, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/constants/app";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { formatNumber } from "@/lib/format";
import { useSubL2Book } from "@/lib/hl-react";
import {
	getMaxTotal,
	getPriceGroupingOptions,
	getSpreadInfo,
	type L2BookPriceGroupOption,
	processLevels,
} from "@/lib/trade/orderbook";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { BookRow } from "./book-row";
import { TradesView } from "./trades-view";

const VISIBLE_ROWS = 9;

export function OrderBookPanel() {
	const [selectedOption, setSelectedOption] = useState<L2BookPriceGroupOption | null>(null);
	const { showOrderbookInUsd } = useGlobalSettings();
	const { setShowOrderbookInUsd } = useGlobalSettingsActions();

	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "none" });

	const {
		data: orderbook,
		status: orderbookStatus,
		error: orderbookError,
	} = useSubL2Book({
		coin: selectedMarket.coin,
		nSigFigs: selectedOption?.nSigFigs,
		mantissa: selectedOption?.mantissa,
	});

	const bids = useMemo(() => processLevels(orderbook?.levels[0], VISIBLE_ROWS), [orderbook?.levels]);
	const asks = useMemo(() => processLevels(orderbook?.levels[1], VISIBLE_ROWS), [orderbook?.levels]);
	const maxTotal = getMaxTotal(bids, asks);
	const spreadInfo = getSpreadInfo(bids, asks);
	const priceGroupingOptions = getPriceGroupingOptions(spreadInfo.mid);

	const szDecimals = selectedMarket.szDecimals;
	const toggleUsdDisplay = () => setShowOrderbookInUsd(!showOrderbookInUsd);

	return (
		<Tabs defaultValue="book" className="h-full min-h-0 flex flex-col overflow-hidden border-l border-border/40">
			<div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-surface/30">
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
				<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider border-b border-border/40 shrink-0">
					<div className="flex items-center gap-1">
						{t`Price`}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="px-1.5 py-0.5 text-4xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
									aria-label={t`Select order book aggregation`}
								>
									{selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
									<ChevronDown className="size-2.5" />
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
						type="button"
						onClick={toggleUsdDisplay}
						className="text-right hover:text-foreground transition-colors inline-flex items-center justify-end gap-0.5"
					>
						{t`Size`}
						<span className="opacity-60">({showOrderbookInUsd ? "$" : selectedMarket.coin})</span>
						<ArrowRightLeft className="size-2 opacity-40" />
					</button>
					<button
						type="button"
						onClick={toggleUsdDisplay}
						className="text-right hover:text-foreground transition-colors inline-flex items-center justify-end gap-0.5"
					>
						{t`Total`}
						<span className="opacity-60">({showOrderbookInUsd ? "$" : selectedMarket.coin})</span>
						<ArrowRightLeft className="size-2 opacity-40" />
					</button>
				</div>

				<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
					{orderbookStatus !== "error" && asks.length > 0 ? (
						<div className="flex-1 flex flex-col justify-end gap-px py-0.5">
							{[...asks].reverse().map((level, i) => (
								<BookRow
									key={`ask-${level.price}-${i}`}
									level={level}
									side="ask"
									maxTotal={maxTotal}
									showInUsd={showOrderbookInUsd}
									szDecimals={szDecimals}
								/>
							))}
						</div>
					) : (
						<div className="flex-1 flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
							{orderbookStatus === "error" ? t`Failed to load order book.` : t`Waiting for order book...`}
						</div>
					)}

					<div className="shrink-0 py-1.5 px-2 flex items-center justify-center gap-2 border-y border-border/40 bg-surface/30">
						<span className="text-sm font-semibold tabular-nums text-terminal-amber terminal-glow-amber">
							{formatNumber(spreadInfo.mid, selectedMarket.szDecimals)}
						</span>
					</div>

					{orderbookStatus !== "error" && bids.length > 0 && (
						<div className="flex-1 flex flex-col gap-px py-0.5">
							{bids.map((level, i) => (
								<BookRow
									key={`bid-${level.price}-${i}`}
									level={level}
									side="bid"
									maxTotal={maxTotal}
									showInUsd={showOrderbookInUsd}
									szDecimals={szDecimals}
								/>
							))}
						</div>
					)}
				</div>

				<div className="mt-auto shrink-0 px-2 py-1.5 border-t border-border/40 flex items-center justify-between text-4xs text-muted-foreground">
					<span>{t`Spread`}</span>
					<span className="tabular-nums text-terminal-amber">
						{spreadInfo.spread && spreadInfo.spreadPct
							? `${formatNumber(spreadInfo.spread, 2)} (${formatNumber(spreadInfo.spreadPct, 3)}%)`
							: FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</div>
				{orderbookStatus === "error" && (
					<div className="shrink-0 px-2 pb-1.5 text-4xs text-terminal-red/80">
						{orderbookError instanceof Error ? orderbookError.message : t`WebSocket error`}
					</div>
				)}
			</TabsContent>

			<TabsContent value="trades" className="flex-1 min-h-0 flex flex-col">
				<TradesView key={selectedMarket.coin} />
			</TabsContent>
		</Tabs>
	);
}
