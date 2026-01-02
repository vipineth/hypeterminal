import { Timer } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { usePerpMarketRegistry } from "@/hooks/hyperliquid/use-market-registry";
import { useTwapHistory } from "@/hooks/hyperliquid/use-twap-history";
import { formatNumber, formatPrice } from "@/lib/format";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { useConnection } from "wagmi";

const TWAP_TEXT = UI_TEXT.TWAP_TAB;

export function TwapTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useTwapHistory({ user: isConnected ? address : undefined });
	const { registry } = usePerpMarketRegistry();

	const orders = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.state.timestamp - a.state.timestamp);
		return sorted;
	}, [data]);

	const activeOrders = useMemo(() => {
		return orders.filter((o) => o.status.status === "activated");
	}, [orders]);

	const headerCount = isConnected ? `${activeOrders.length} ${TWAP_TEXT.COUNT_LABEL}` : FALLBACK_VALUE_PLACEHOLDER;

	const tableRows = useMemo(() => {
		return orders.map((order) => {
			const isBuy = order.state.side === "B";
			const totalSize = parseNumber(order.state.sz);
			const executedSize = parseNumber(order.state.executedSz);
			const executedNtl = parseNumber(order.state.executedNtl);
			const marketInfo = registry?.coinToInfo.get(order.state.coin);
			const szDecimals = marketInfo?.szDecimals ?? 4;

			const avgPrice =
				Number.isFinite(executedNtl) && Number.isFinite(executedSize) && executedSize !== 0
					? executedNtl / executedSize
					: Number.NaN;

			const rawProgressPct =
				Number.isFinite(totalSize) && totalSize !== 0 && Number.isFinite(executedSize)
					? (executedSize / totalSize) * 100
					: 0;
			const progressPct = Math.max(0, Math.min(100, rawProgressPct));

			const rawStatus = order.status.status;
			const statusLabel =
				rawStatus === "activated"
					? TWAP_TEXT.STATUS_ACTIVE
					: rawStatus === "finished"
						? TWAP_TEXT.STATUS_COMPLETED
						: rawStatus === "terminated"
							? TWAP_TEXT.STATUS_CANCELLED
							: rawStatus;

			return {
				key: typeof order.twapId === "number" ? order.twapId : `${order.state.coin}-${order.state.timestamp}-${order.time}`,
				coin: order.state.coin,
				sideLabel: isBuy ? TWAP_TEXT.SIDE_BUY : TWAP_TEXT.SIDE_SELL,
				sideClass: isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				totalSizeText: Number.isFinite(totalSize) ? formatNumber(totalSize, 4) : String(order.state.sz),
				executedSizeText: Number.isFinite(executedSize) ? formatNumber(executedSize, 4) : String(order.state.executedSz),
				avgPriceText: Number.isFinite(avgPrice) ? formatPrice(avgPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				progressPct,
				rawStatus,
				statusLabel,
				showCancel: rawStatus === "activated",
			};
		});
	}, [orders, registry]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Timer className="size-3" />
				{TWAP_TEXT.TITLE}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{TWAP_TEXT.CONNECT}
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{TWAP_TEXT.LOADING}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{TWAP_TEXT.FAILED}</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : orders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{TWAP_TEXT.EMPTY}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{TWAP_TEXT.HEADER_ASSET}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{TWAP_TEXT.HEADER_TOTAL_SIZE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{TWAP_TEXT.HEADER_EXECUTED}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{TWAP_TEXT.HEADER_AVG_PRICE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{TWAP_TEXT.HEADER_PROGRESS}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{TWAP_TEXT.HEADER_STATUS}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{TWAP_TEXT.HEADER_ACTIONS}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => (
									<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
													{row.sideLabel}
												</span>
												<span>{row.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.totalSizeText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
											{row.executedSizeText}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.avgPriceText}</TableCell>
										<TableCell className="py-1.5">
											<div className="flex items-center gap-2">
												<div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
													<div
														className={cn(
															"h-full rounded-full",
															row.rawStatus === "finished" ? "bg-terminal-green" : "bg-terminal-cyan",
														)}
														style={{ width: `${row.progressPct}%` }}
													/>
												</div>
												<span className="text-4xs tabular-nums text-muted-foreground">
													{row.progressPct.toFixed(0)}%
												</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span
												className={cn(
													"text-4xs px-1 py-0.5 rounded-sm uppercase",
													row.rawStatus === "activated" && "bg-terminal-cyan/20 text-terminal-cyan",
													row.rawStatus === "finished" && "bg-terminal-green/20 text-terminal-green",
													(row.rawStatus === "terminated" || row.rawStatus === "error") && "bg-terminal-red/20 text-terminal-red",
												)}
											>
												{row.statusLabel}
											</span>
										</TableCell>
										<TableCell className="text-right py-1.5">
											{row.showCancel && (
												<button
													type="button"
													className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
													tabIndex={0}
													aria-label={TWAP_TEXT.ARIA_CANCEL}
												>
													{TWAP_TEXT.ACTION_CANCEL}
												</button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
