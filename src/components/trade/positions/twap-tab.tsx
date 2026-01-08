import { t } from "@lingui/core/macro";
import { Timer } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/constants/app";
import { formatNumber, formatPrice } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubUserTwapHistory } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";

export function TwapTab() {
	const { address, isConnected } = useConnection();
	const {
		data: twapEvent,
		status,
		error,
	} = useSubUserTwapHistory({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const data = twapEvent?.history;
	const { getSzDecimals } = usePerpMarkets();

	const orders = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.state.timestamp - a.state.timestamp);
		return sorted;
	}, [data]);

	const activeOrders = useMemo(() => {
		return orders.filter((o) => o.status.status === "activated");
	}, [orders]);

	const headerCount = isConnected ? `${activeOrders.length} ${t`Active`}` : FALLBACK_VALUE_PLACEHOLDER;

	const tableRows = useMemo(() => {
		return orders.map((order) => {
			const isBuy = order.state.side === "B";
			const totalSize = parseNumber(order.state.sz);
			const executedSize = parseNumber(order.state.executedSz);
			const executedNtl = parseNumber(order.state.executedNtl);
			const szDecimals = getSzDecimals(order.state.coin) ?? 4;

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
					? t`active`
					: rawStatus === "finished"
						? t`completed`
						: rawStatus === "terminated"
							? t`cancelled`
							: rawStatus;

			return {
				key:
					typeof order.twapId === "number"
						? order.twapId
						: `${order.state.coin}-${order.state.timestamp}-${order.time}`,
				coin: order.state.coin,
				sideLabel: isBuy ? t`buy` : t`sell`,
				sideClass: isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				totalSizeText: Number.isFinite(totalSize) ? formatNumber(totalSize, szDecimals) : String(order.state.sz),
				executedSizeText: Number.isFinite(executedSize)
					? formatNumber(executedSize, szDecimals)
					: String(order.state.executedSz),
				avgPriceText: Number.isFinite(avgPrice) ? formatPrice(avgPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				progressPct,
				rawStatus,
				statusLabel,
				showCancel: rawStatus === "activated",
			};
		});
	}, [orders, getSzDecimals]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Timer className="size-3" />
				{t`TWAP Orders`}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view TWAP orders.`}
					</div>
				) : status === "subscribing" || status === "idle" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading TWAP orders...`}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load TWAP history.`}</span>
						{error instanceof Error ? (
							<span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>
						) : null}
					</div>
				) : orders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No TWAP orders found.`}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Total Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Executed`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Avg Price`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Progress`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Status`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Actions`}
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
													(row.rawStatus === "terminated" || row.rawStatus === "error") &&
														"bg-terminal-red/20 text-terminal-red",
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
													aria-label={t`Cancel TWAP order`}
												>
													{t`Cancel`}
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
