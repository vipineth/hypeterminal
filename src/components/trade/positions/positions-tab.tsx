import { Circle } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useClearinghouseState, usePerpAssetCtxsSnapshot, usePerpMarketRegistry } from "@/hooks/hyperliquid";
import { useConnection } from "wagmi";

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const { data: state, status, error } = useClearinghouseState({ user: isConnected ? address : undefined });

	const positions = useMemo(() => {
		const raw = state?.assetPositions ?? [];
		return raw
			.map((p) => p.position)
			.filter((p) => {
				const size = parseNumber(p.szi);
				return Number.isFinite(size) && size !== 0;
			});
	}, [state]);

	const { registry } = usePerpMarketRegistry();
	const snapshotCtxs = usePerpAssetCtxsSnapshot({
		enabled: isConnected && positions.length > 0,
		intervalMs: 10_000,
	});

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Circle className="size-1.5 fill-terminal-green text-terminal-green" />
				Active Positions
				<span className="text-terminal-cyan ml-auto tabular-nums">{isConnected ? positions.length : "-"}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view positions.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading positions...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load positions.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : positions.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No active positions.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Size
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Value
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Entry
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Mark
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										PNL
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Liq
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{positions.map((p) => {
									const size = parseNumber(p.szi);
									const isLong = size > 0;

									const entryPx = parseNumber(p.entryPx);
									const positionValue = parseNumber(p.positionValue);
									const unrealizedPnl = parseNumber(p.unrealizedPnl);
									const roe = parseNumber(p.returnOnEquity);
									const liquidationPx = p.liquidationPx ? parseNumber(p.liquidationPx) : Number.NaN;

									const marketInfo = registry?.coinToInfo.get(p.coin);
									const szDecimals = marketInfo?.szDecimals ?? 4;
									const assetIndex = marketInfo?.assetIndex;
									const markPxRaw = typeof assetIndex === "number" ? snapshotCtxs?.[assetIndex]?.markPx : undefined;
									const markPx = markPxRaw ? parseNumber(markPxRaw) : Number.NaN;

									return (
										<TableRow key={`${p.coin}-${p.entryPx}-${p.szi}`} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span
														className={cn(
															"text-4xs px-1 py-0.5 rounded-sm uppercase",
															isLong
																? "bg-terminal-green/20 text-terminal-green"
																: "bg-terminal-red/20 text-terminal-red",
														)}
													>
														{isLong ? "Long" : "Short"}
													</span>
													<span>{p.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(size) ? formatToken(Math.abs(size), szDecimals) : "-"}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(positionValue) ? formatUSD(Math.abs(positionValue), { compact: true }) : "-"}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(entryPx) ? formatPrice(entryPx, { szDecimals }) : "-"}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
												{Number.isFinite(markPx) ? formatPrice(markPx, { szDecimals }) : "-"}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<div
													className={cn(
														"text-2xs tabular-nums",
														unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
													)}
												>
													{Number.isFinite(unrealizedPnl) ? formatUSD(unrealizedPnl, { signDisplay: "exceptZero" }) : "-"}
													<span className="text-muted-foreground ml-1">
														({Number.isFinite(roe) ? formatPercent(roe, 1) : "-"})
													</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-terminal-red/70 py-1.5">
												{Number.isFinite(liquidationPx) ? formatPrice(liquidationPx, { szDecimals }) : "-"}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<div className="flex justify-end gap-1">
													<button
														type="button"
														className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
														tabIndex={0}
														aria-label="Close position"
													>
														Close
													</button>
													<button
														type="button"
														className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/60 hover:text-terminal-cyan transition-colors"
														tabIndex={0}
														aria-label="Set TP/SL"
													>
														TP/SL
													</button>
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
