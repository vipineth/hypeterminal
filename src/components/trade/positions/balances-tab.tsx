import { t } from "@lingui/core/macro";
import { Wallet } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { formatToken, formatUSD } from "@/lib/format";
import { useSubClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumberOrZero } from "@/lib/trade/numbers";
import clsx from "clsx";
import { TokenAvatar } from "../components/token-avatar";

type BalanceRow = {
	asset: string;
	type: "perp" | "spot";
	available: number;
	inOrder: number;
	total: number;
	usdValue: number;
};

export function BalancesTab() {
	const { address, isConnected } = useConnection();

	const { data: perpEvent, status: perpStatus } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const perpData = perpEvent?.clearinghouseState;

	const { data: spotEvent, status: spotStatus } = useSubSpotState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const spotData = spotEvent?.spotState;

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

	const totalValue = balances.reduce((acc, b) => acc + b.usdValue, 0);
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

	const isLoading =
		perpStatus === "subscribing" || spotStatus === "subscribing" || perpStatus === "idle" || spotStatus === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				{t`Account Balances`}
				<span className="text-terminal-cyan ml-auto tabular-nums">
					{isConnected && !isLoading ? formatUSD(totalValue, { compact: true }) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view balances.`}
					</div>
				) : isLoading ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading balances...`}
					</div>
				) : hasError ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load balances.`}</span>
					</div>
				) : balances.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No balances found. Deposit funds to start trading.`}
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
										{t`Available`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`In Use`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Total`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`USD Value`}
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
													className={clsx(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														row.type === "perp"
															? "bg-terminal-purple/20 text-terminal-purple"
															: "bg-terminal-amber/20 text-terminal-amber",
													)}
												>
													{row.type === "perp" ? t`perp` : t`spot`}
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
