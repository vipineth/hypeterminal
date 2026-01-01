import { ListOrdered } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatNumber, formatUSD } from "@/lib/format";
import { useOpenOrders } from "@/hooks/hyperliquid";
import { useConnection } from "wagmi";

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

export function OrdersTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useOpenOrders({ user: isConnected ? address : undefined });

	const openOrders = useMemo(() => data ?? [], [data]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<ListOrdered className="size-3" />
				Open Orders
				<span className="text-terminal-cyan ml-auto tabular-nums">{isConnected ? openOrders.length : "-"}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view open orders.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading open orders...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load open orders.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : openOrders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No open orders.
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
										Filled
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Status</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{openOrders.map((o) => {
									const isBuy = o.side === "B";
									const origSz = parseNumber(o.origSz);
									const remaining = parseNumber(o.sz);
									const filled =
										Number.isFinite(origSz) && Number.isFinite(remaining) ? Math.max(0, origSz - remaining) : 0;
									const fillPct = Number.isFinite(origSz) && origSz !== 0 ? (filled / origSz) * 100 : 0;
									const limitPx = parseNumber(o.limitPx);

									return (
										<TableRow key={o.oid} className="border-border/40 hover:bg-accent/30">
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
													<span>{o.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">
													{o.reduceOnly ? "limit ro" : "limit"}
												</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(limitPx) ? formatUSD(limitPx, { compact: false }) : String(o.limitPx)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(origSz) ? formatNumber(origSz, 4) : String(o.origSz)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={cn(filled > 0 && "text-terminal-amber")}>
													{Number.isFinite(filled) ? formatNumber(filled, 4) : "-"} ({fillPct.toFixed(0)}%)
												</span>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-terminal-cyan/20 text-terminal-cyan">
													open
												</span>
											</TableCell>
											<TableCell className="text-right py-1.5">
												<button
													type="button"
													className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
													tabIndex={0}
													aria-label="Cancel order"
												>
													Cancel
												</button>
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
