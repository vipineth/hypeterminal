import { t } from "@lingui/core/macro";
import { TimerIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeTicker } from "@/components/ui/time-ticker";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/constants";
import { getAvgPrice } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDuration, formatNumber, formatPrice } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useSubTwapStates } from "@/lib/hyperliquid/hooks/subscription";
import { toBig } from "@/lib/trade/numbers";
import { useMarketActions } from "@/stores/use-market-store";

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

export function TwapTab() {
	const { address, isConnected } = useConnection();
	const { setSelectedMarket } = useMarketActions();
	const { data: twapStatesEvent } = useSubTwapStates(
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const markets = useMarkets();

	const twapStates = twapStatesEvent?.states ?? [];

	const activeOrders = useMemo(
		() =>
			twapStates.map(([twapId, state]) => ({ twapId, state })).sort((a, b) => b.state.timestamp - a.state.timestamp),
		[twapStates],
	);

	const activeCount = activeOrders.length;

	const headerCount = isConnected ? `${activeCount} ${t`Active`}` : FALLBACK_VALUE_PLACEHOLDER;

	const twapStatesStatus = twapStatesEvent ? "active" : "loading";

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view TWAP orders.`}</Placeholder>;
		if (twapStatesStatus === "loading") return <Placeholder>{t`Loading TWAP orders...`}</Placeholder>;
		if (activeOrders.length === 0) return <Placeholder>{t`No active TWAP orders.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-text-600 mb-1.5 flex items-center gap-2">
				<TimerIcon className="size-3" />
				{t`TWAP Orders`}
				<span className="text-primary-default ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border-200/40 rounded-sm bg-surface-base/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border-200/40 bg-surface-analysis hover:bg-surface-analysis">
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Executed`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Avg Price`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">
										{t`Time / Total`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">
										{t`Reduce Only`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">{t`Created`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{activeOrders.map(({ twapId, state }, i) => {
									const isBuy = state.side === "B";
									const sideClass = isBuy
										? "bg-market-up-100 text-market-up-600"
										: "bg-market-down-100 text-market-down-600";
									const totalSize = toBig(state.sz)?.toNumber() ?? Number.NaN;
									const executedSize = toBig(state.executedSz)?.toNumber() ?? 0;
									const avgPrice = getAvgPrice(state.executedNtl, state.executedSz);
									const szDecimals = markets.getSzDecimals(state.coin);
									const creationTime = state.timestamp;
									const totalMinutes = state.minutes;

									return (
										<TableRow
											key={twapId}
											className={cn(
												"border-border-200/40 hover:bg-surface-analysis/30",
												i % 2 === 1 && "bg-surface-analysis",
											)}
										>
											<TableCell className="text-3xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideClass)}>
														{isBuy ? t`buy` : t`sell`}
													</span>
													<Button
														variant="text"
														size="none"
														onClick={() => setSelectedMarket(state.coin)}
														aria-label={t`Switch to ${markets.getMarket(state.coin)?.displayName ?? state.coin} market`}
													>
														{markets.getMarket(state.coin)?.displayName ?? state.coin}
													</Button>
												</div>
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												{formatNumber(totalSize, szDecimals)}
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												<span className={cn(isBuy ? "text-market-up-600" : "text-market-down-600")}>
													{formatNumber(executedSize, szDecimals)}
												</span>
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												{formatPrice(avgPrice, { szDecimals })}
											</TableCell>
											<TableCell className="text-3xs tabular-nums py-1.5">
												<TimeTicker startTime={creationTime} durationMs={totalMinutes * 60 * 1000} isActive={true} /> /{" "}
												{formatDuration(totalMinutes)}
											</TableCell>
											<TableCell className="text-3xs py-1.5">{state.reduceOnly ? t`Yes` : t`No`}</TableCell>
											<TableCell className="text-3xs tabular-nums py-1.5">
												{formatDateTime(creationTime, {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
													second: "2-digit",
													hour12: false,
												})}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<Button
													variant="outlined"
													size="sm"
													className="border-market-down-600 text-market-down-600 hover:border-market-down-600/80 hover:bg-market-down-100"
													aria-label={t`Cancel TWAP order`}
												>
													{t`Cancel`}
												</Button>
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
