import { Wallet } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatToken, formatUSD } from "@/lib/format";
import { useSpotClearinghouseState } from "@/hooks/hyperliquid";
import { useConnection } from "wagmi";

type BalanceRow = {
	asset: string;
	available: number;
	inOrder: number;
	total: number;
	usdValue: number;
};

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

export function BalancesTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useSpotClearinghouseState({
		user: isConnected ? address : undefined,
	});

	const balances = useMemo((): BalanceRow[] => {
		if (!data) return [];

		const rows = data.balances
			.map((b): BalanceRow | null => {
				const total = parseNumber(b.total);
				const hold = parseNumber(b.hold);
				const entryNtl = parseNumber(b.entryNtl);

				if (!Number.isFinite(total) || total === 0) return null;

				const inOrder = Number.isFinite(hold) ? hold : 0;
				const available = Math.max(0, total - inOrder);
				const usdValue = b.coin === "USDC" ? total : Number.isFinite(entryNtl) ? entryNtl : 0;

				return {
					asset: b.coin,
					available,
					inOrder,
					total,
					usdValue,
				};
			})
			.filter((x): x is BalanceRow => x !== null);

		rows.sort((a, b) => b.usdValue - a.usdValue);
		return rows;
	}, [data]);

	const totalValue = useMemo(() => balances.reduce((acc, b) => acc + b.usdValue, 0), [balances]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				Account Balances
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected && status !== "pending" ? formatUSD(totalValue, { compact: true }) : "-"}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Connect your wallet to view balances.
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						Loading balances...
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>Failed to load balances.</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : balances.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						No balances found.
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										Available
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										In Order
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
									<TableRow key={b.asset} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<span className="text-terminal-cyan">{b.asset}</span>
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
