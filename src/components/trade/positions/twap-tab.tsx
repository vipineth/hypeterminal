import { Timer } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTwapHistory } from "@/hooks/hyperliquid";
import { formatNumber, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useConnection } from "wagmi";

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

export function TwapTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useTwapHistory({ user: isConnected ? address : undefined });

	const orders = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.state.timestamp - a.state.timestamp);
		return sorted;
	}, [data]);

	const activeOrders = useMemo(() => {
		return orders.filter((o) => o.status.status === "activated");
	}, [orders]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Timer className="size-3" />
				TWAP Orders
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected ? `${activeOrders.length} Active` : "-"}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view TWAP orders.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading TWAP orders...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load TWAP history.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : orders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No TWAP orders found.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Total Size
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Executed
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Avg Price
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										Progress
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Status</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((t) => {
									const isBuy = t.state.side === "B";
									const totalSize = parseNumber(t.state.sz);
									const executedSize = parseNumber(t.state.executedSz);
									const executedNtl = parseNumber(t.state.executedNtl);

									const avgPrice =
										Number.isFinite(executedNtl) && Number.isFinite(executedSize) && executedSize !== 0
											? executedNtl / executedSize
											: Number.NaN;

									const rawProgressPct =
										Number.isFinite(totalSize) && totalSize !== 0 && Number.isFinite(executedSize)
											? (executedSize / totalSize) * 100
											: 0;
									const progressPct = Math.max(0, Math.min(100, rawProgressPct));

									const rawStatus = t.status.status;
									const statusLabel =
										rawStatus === "activated"
											? "active"
											: rawStatus === "finished"
												? "completed"
												: rawStatus === "terminated"
													? "cancelled"
													: rawStatus;

									return (
										<TableRow
											key={typeof t.twapId === "number" ? t.twapId : `${t.state.coin}-${t.state.timestamp}-${t.time}`}
											className="border-border/40 hover:bg-accent/30"
										>
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span
														className={cn(
															"text-4xs px-1 py-0.5 rounded-sm uppercase",
															isBuy
																? "bg-terminal-green/20 text-terminal-green"
																: "bg-terminal-red/20 text-terminal-red",
														)}
													>
														{isBuy ? "buy" : "sell"}
													</span>
													<span>{t.state.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(totalSize) ? formatNumber(totalSize, 4) : String(t.state.sz)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
												{Number.isFinite(executedSize) ? formatNumber(executedSize, 4) : String(t.state.executedSz)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(avgPrice) ? formatUSD(avgPrice) : "-"}
											</TableCell>
											<TableCell className="py-1.5">
												<div className="flex items-center gap-2">
													<div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
														<div
															className={cn(
																"h-full rounded-full",
																rawStatus === "finished" ? "bg-terminal-green" : "bg-terminal-cyan",
															)}
															style={{ width: `${progressPct}%` }}
														/>
													</div>
													<span className="text-4xs tabular-nums text-muted-foreground">{progressPct.toFixed(0)}%</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														rawStatus === "activated" && "bg-terminal-cyan/20 text-terminal-cyan",
														rawStatus === "finished" && "bg-terminal-green/20 text-terminal-green",
														(rawStatus === "terminated" || rawStatus === "error") && "bg-terminal-red/20 text-terminal-red",
													)}
												>
													{statusLabel}
												</span>
											</TableCell>
											<TableCell className="text-right py-1.5">
												{rawStatus === "activated" && (
													<button
														type="button"
														className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
														tabIndex={0}
														aria-label="Cancel TWAP order"
													>
														Cancel
													</button>
												)}
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
