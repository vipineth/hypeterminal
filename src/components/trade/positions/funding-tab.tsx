import { Percent } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserFunding } from "@/hooks/hyperliquid";
import { formatNumber, formatPercent, formatUSD } from "@/lib/format";
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

export function FundingTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useUserFunding({ user: isConnected ? address : undefined });

	const updates = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.time - a.time);
		return sorted.slice(0, 200);
	}, [data]);

	const totalFunding = useMemo(() => {
		return updates.reduce((acc, f) => {
			const usdc = parseNumber(f.delta.usdc);
			return acc + (Number.isFinite(usdc) ? usdc : 0);
		}, 0);
	}, [updates]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Percent className="size-3" />
				Funding Payments
				<span className={cn("ml-auto tabular-nums", totalFunding >= 0 ? "text-terminal-green" : "text-terminal-red")}>
					{isConnected && status !== "pending" ? formatUSD(totalFunding, { signDisplay: "exceptZero" }) : "-"}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view funding payments.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading funding history...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load funding history.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : updates.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No funding payments found.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Position
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Rate
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Payment
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Time
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{updates.map((u) => {
									const szi = parseNumber(u.delta.szi);
									const isLong = Number.isFinite(szi) ? szi > 0 : true;
									const positionSize = Number.isFinite(szi) ? Math.abs(szi) : Number.NaN;

									const rate = parseNumber(u.delta.fundingRate);
									const usdc = parseNumber(u.delta.usdc);

									const date = new Date(u.time);
									const timeStr = date.toLocaleTimeString("en-US", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									});
									const dateStr = date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});

									return (
										<TableRow key={`${u.hash}-${u.time}`} className="border-border/40 hover:bg-accent/30">
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
													<span>{u.delta.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{Number.isFinite(positionSize) ? formatNumber(positionSize, 4) : "-"}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={cn(rate >= 0 ? "text-terminal-green" : "text-terminal-red")}>
													{Number.isFinite(rate)
														? formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
														: "-"}
												</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={cn(usdc >= 0 ? "text-terminal-green" : "text-terminal-red")}>
													{Number.isFinite(usdc) ? formatUSD(usdc, { signDisplay: "exceptZero" }) : "-"}
												</span>
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
