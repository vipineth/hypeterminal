import { Wallet } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useSpotClearinghouseState } from "@/hooks/hyperliquid/use-spot-clearinghouse-state";
import { formatToken, formatUSD } from "@/lib/format";
import { parseNumberOrZero } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { TokenAvatar } from "../components/token-avatar";

type BalanceRow = {
	asset: string;
	type: "perp" | "spot";
	available: number;
	inOrder: number;
	total: number;
	usdValue: number;
};

const BALANCES_TEXT = UI_TEXT.BALANCES_TAB;

export function BalancesTab() {
	const { address, isConnected } = useConnection();

	const { data: perpData, status: perpStatus } = useClearinghouseState({
		user: address,
		enabled: isConnected,
	});

	const { data: spotData, status: spotStatus } = useSpotClearinghouseState({
		user: isConnected ? address : undefined,
	});

	const balances = useMemo((): BalanceRow[] => {
		const rows: BalanceRow[] = [];

		if (perpData?.crossMarginSummary) {
			const summary = perpData.crossMarginSummary;
			const accountValue = parseNumberOrZero(summary.accountValue);
			const totalMarginUsed = parseNumberOrZero(summary.totalMarginUsed);

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

		if (spotData?.balances) {
			for (const b of spotData.balances) {
				const total = parseNumberOrZero(b.total);
				const hold = parseNumberOrZero(b.hold);
				const entryNtl = parseNumberOrZero(b.entryNtl);

				if (total === 0) continue;

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

		rows.sort((a, b) => b.usdValue - a.usdValue);
		return rows;
	}, [perpData, spotData]);

	const totalValue = useMemo(() => balances.reduce((acc, b) => acc + b.usdValue, 0), [balances]);
	const displayRows = useMemo(() => {
		return balances.map((balance) => {
			const decimals = balance.asset === "USDC" ? 2 : 5;
			return {
				...balance,
				decimals,
				availableText: formatToken(balance.available, decimals),
				inOrderText: formatToken(balance.inOrder, decimals),
				totalText: formatToken(balance.total, decimals),
				usdValueText: formatUSD(balance.usdValue, { compact: true }),
			};
		});
	}, [balances]);

	const isLoading = perpStatus === "pending" || spotStatus === "pending";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				{BALANCES_TEXT.TITLE}
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected && !isLoading ? formatUSD(totalValue, { compact: true }) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{BALANCES_TEXT.CONNECT}
					</div>
				) : isLoading ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{BALANCES_TEXT.LOADING}
					</div>
				) : hasError ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{BALANCES_TEXT.FAILED}</span>
					</div>
				) : balances.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{BALANCES_TEXT.EMPTY}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{BALANCES_TEXT.HEADER_ASSET}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{BALANCES_TEXT.HEADER_AVAILABLE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{BALANCES_TEXT.HEADER_IN_USE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{BALANCES_TEXT.HEADER_TOTAL}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{BALANCES_TEXT.HEADER_USD_VALUE}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{displayRows.map((row) => (
									<TableRow key={`${row.type}-${row.asset}`} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<TokenAvatar symbol={row.asset} />
												<span className="text-terminal-cyan">{row.asset}</span>
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														row.type === "perp"
															? "bg-terminal-purple/20 text-terminal-purple"
															: "bg-terminal-amber/20 text-terminal-amber",
													)}
												>
													{row.type === "perp" ? BALANCES_TEXT.TYPE_PERP : BALANCES_TEXT.TYPE_SPOT}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.availableText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
											{row.inOrderText}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.totalText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-green py-1.5">
											{row.usdValueText}
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
