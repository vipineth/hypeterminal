import { Wallet } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClearinghouseState, useSpotClearinghouseState } from "@/hooks/hyperliquid";
import { formatToken, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

type BalanceRow = {
	asset: string;
	type: "perp" | "spot";
	available: number;
	inOrder: number;
	total: number;
	usdValue: number;
};

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

export function BalancesTab() {
	const { address, isConnected } = useConnection();

	// Get perp clearinghouse for USDC balance
	const { data: perpData, status: perpStatus } = useClearinghouseState({
		user: address,
		enabled: isConnected,
	});

	// Get spot clearinghouse for token balances
	const { data: spotData, status: spotStatus } = useSpotClearinghouseState({
		user: isConnected ? address : undefined,
	});

	const balances = useMemo((): BalanceRow[] => {
		const rows: BalanceRow[] = [];

		// Add perp USDC balance (from cross margin)
		if (perpData?.crossMarginSummary) {
			const summary = perpData.crossMarginSummary;
			const accountValue = parseNumber(summary.accountValue);
			const totalMarginUsed = parseNumber(summary.totalMarginUsed);

			// Only show if there's actual balance
			if (accountValue > 0) {
				rows.push({
					asset: "USDC",
					type: "perp",
					available: Math.max(0, accountValue - totalMarginUsed),
					inOrder: totalMarginUsed,
					total: accountValue,
					usdValue: accountValue,
				});
			}
		}

		// Add spot token balances
		if (spotData?.balances) {
			for (const b of spotData.balances) {
				const total = parseNumber(b.total);
				const hold = parseNumber(b.hold);
				const entryNtl = parseNumber(b.entryNtl);

				if (total === 0) continue;

				// Skip USDC if we already added it from perp (avoid duplicate)
				// Spot USDC is separate from perp USDC
				const available = Math.max(0, total - hold);
				const usdValue = b.coin === "USDC" ? total : entryNtl;

				rows.push({
					asset: b.coin,
					type: "spot",
					available,
					inOrder: hold,
					total,
					usdValue,
				});
			}
		}

		// Sort by USD value descending
		rows.sort((a, b) => b.usdValue - a.usdValue);
		return rows;
	}, [perpData, spotData]);

	const totalValue = useMemo(() => balances.reduce((acc, b) => acc + b.usdValue, 0), [balances]);

	const isLoading = perpStatus === "pending" || spotStatus === "pending";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				Account Balances
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected && !isLoading ? formatUSD(totalValue, { compact: true }) : "-"}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view balances.
					</div>
				) : isLoading ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading balances...
					</div>
				) : hasError ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load balances.</span>
					</div>
				) : balances.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No balances found. Deposit funds to start trading.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										Asset
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Available
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										In Use
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Total
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										USD Value
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{balances.map((b) => (
									<TableRow key={`${b.type}-${b.asset}`} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className="text-terminal-cyan">{b.asset}</span>
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														b.type === "perp"
															? "bg-terminal-purple/20 text-terminal-purple"
															: "bg-terminal-amber/20 text-terminal-amber",
													)}
												>
													{b.type}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											{formatToken(b.available, b.asset === "USDC" ? 2 : 5)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
											{formatToken(b.inOrder, b.asset === "USDC" ? 2 : 5)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											{formatToken(b.total, b.asset === "USDC" ? 2 : 5)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-green py-1.5">
											{formatUSD(b.usdValue, { compact: true })}
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
