import { History } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserFills } from "@/hooks/hyperliquid";
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

export function HistoryTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useUserFills({ user: isConnected ? address : undefined, aggregateByTime: true });

	const fills = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.time - a.time);
		return sorted.slice(0, 200);
	}, [data]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<History className="size-3" />
				Trade History
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected ? `${fills.length} Trades` : "-"}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view trade history.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading trade history...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load trade history.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : fills.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No fills found.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Type</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Price
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Size
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Fee
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										PNL
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Time
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{fills.map((f) => {
									const isBuy = f.side === "B";
									const date = new Date(f.time);
									const timeStr = date.toLocaleTimeString("en-US", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									});
									const dateStr = date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});

									const px = parseNumber(f.px);
									const sz = parseNumber(f.sz);
									const fee = parseNumber(f.fee);
									const closedPnl = parseNumber(f.closedPnl);

									return (
										<TableRow key={`${f.hash}-${f.tid}`} className="border-border/40 hover:bg-accent/30">
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
													<span>{f.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{f.dir}</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(px) ? formatUSD(px) : String(f.px)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(sz) ? formatNumber(sz, 4) : String(f.sz)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span
													className={cn(
														Number.isFinite(fee) && fee < 0 ? "text-terminal-green" : "text-muted-foreground",
													)}
												>
													{Number.isFinite(fee) ? formatUSD(fee, { signDisplay: "exceptZero" }) : "-"}
												</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(closedPnl) && closedPnl !== 0 ? (
													<span className={cn(closedPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
														{formatUSD(closedPnl, { signDisplay: "exceptZero" })}
													</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-muted-foreground py-1.5">
												<div className="flex flex-col items-end">
													<span>{timeStr}</span>
													<span className="text-4xs">{dateStr}</span>
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
