import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatDateTimeShort, formatNumber, formatToken, formatUSD } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useSubUserFills } from "@/lib/hyperliquid/hooks/subscription";
import { getValueColorClass, toNumber } from "@/lib/trade/numbers";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-market-down-600" : "text-text-600",
			)}
		>
			{children}
		</div>
	);
}

export function HistoryTab() {
	const { address, isConnected } = useConnection();
	const { setSelectedMarket } = useMarketActions();
	const markets = useMarkets();
	const {
		data: fillsEvent,
		status,
		error,
	} = useSubUserFills({ user: address ?? "0x0", aggregateByTime: true }, { enabled: isConnected && !!address });

	const fills = fillsEvent?.fills?.slice(0, 200).sort((a, b) => b.time - a.time) ?? [];

	const headerCount = isConnected ? `${fills.length} ${t`Trades`}` : FALLBACK_VALUE_PLACEHOLDER;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view trade history.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading trade history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load trade history.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-text-600">{error.message}</span>}
				</Placeholder>
			);
		}
		if (fills.length === 0) return <Placeholder>{t`No fills found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-text-600 mb-1.5 flex items-center gap-2">
				<ClockCounterClockwiseIcon className="size-3" />
				{t`Trade History`}
				<span className="text-primary-default ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border-200/40 rounded-sm bg-surface-base/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border-200/40 bg-surface-analysis hover:bg-surface-analysis">
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">{t`Type`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Fee`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{fills.map((fill, i) => {
									const fee = toNumber(fill.fee);
									const feeClass = getValueColorClass(fee);
									const closedPnl = toNumber(fill.closedPnl);
									const showPnl = closedPnl !== null && closedPnl !== 0;

									return (
										<TableRow
											key={`${fill.hash}-${fill.tid}`}
											className={cn(
												"border-border-200/40 hover:bg-surface-analysis/30",
												i % 2 === 1 && "bg-surface-analysis",
											)}
										>
											<TableCell className="text-xs font-medium py-1.5">
												<Button
													variant="text"
													size="none"
													onClick={() => setSelectedMarket(fill.coin)}
													className="gap-1.5"
													aria-label={t`Switch to ${fill.coin} market`}
												>
													<AssetDisplay coin={fill.coin} />
												</Button>
											</TableCell>
											<TableCell className="text-xs py-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														fill.liquidation ? "bg-market-down-100 text-market-down-600" : "bg-surface-analysis/50",
													)}
												>
													{fill.liquidation ? t`Liquidated` : fill.dir}
												</span>
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">{formatUSD(fill.px)}</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												{formatNumber(fill.sz, markets.getSzDecimals(fill.coin))}
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												<span className={feeClass}>
													{formatToken(fill.fee, {
														symbol: fill.feeToken,
													})}
												</span>
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												{showPnl ? (
													<span className={getValueColorClass(closedPnl)}>
														{formatUSD(closedPnl, {
															signDisplay: "exceptZero",
														})}
													</span>
												) : (
													<span className="text-text-600">{FALLBACK_VALUE_PLACEHOLDER}</span>
												)}
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums text-text-600 py-1.5">
												<div className="flex flex-col items-end underline decoration-dashed decoration-muted-fg/30">
													<a
														className="flex items-center gap-1"
														href={getExplorerTxUrl(fill.hash) ?? ""}
														target="_blank"
														rel="noopener noreferrer"
													>
														<span>{formatDateTimeShort(fill.time)}</span>
														<ArrowSquareOutIcon className="size-2.5 opacity-100 hover:opacity-80" />
													</a>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
