import Big from "big.js";
import { t } from "@lingui/core/macro";
import { ArrowLeftRight, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken, formatUSD } from "@/lib/format";
import { useSpotTokens } from "@/lib/hyperliquid";
import { TokenAvatar } from "../components/token-avatar";
import { TransferDialog } from "./transfer-dialog";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-negative/80" : "text-muted-fg",
			)}
		>
			{children}
		</div>
	);
}

interface BalanceRow {
	asset: string;
	type: "perp" | "spot";
	available: string;
	inOrder: string;
	total: string;
	usdValue: string;
}

type TransferDirection = "toSpot" | "toPerp";

interface TransferState {
	open: boolean;
	direction: TransferDirection;
	availableBalance: string;
}

export function BalancesTab() {
	const { isConnected } = useConnection();
	const { getDisplayName, getDecimals } = useSpotTokens();
	const [transferState, setTransferState] = useState<TransferState>({
		open: false,
		direction: "toSpot",
		availableBalance: "0",
	});

	const { perp, spot, isLoading, hasError } = useAccountBalances();

	const balances = useMemo((): BalanceRow[] => {
		const rows: BalanceRow[] = [];

		if (Big(perp.accountValue).gt(0)) {
			rows.push({
				asset: "USDC",
				type: "perp",
				available: perp.available,
				inOrder: perp.totalMarginUsed,
				total: perp.accountValue,
				usdValue: perp.accountValue,
			});
		}

		for (const b of spot) {
			const usdValue = b.coin === "USDC" ? b.total : b.entryNtl;
			rows.push({
				asset: b.coin,
				type: "spot",
				available: b.available,
				inOrder: b.hold,
				total: b.total,
				usdValue,
			});
		}

		rows.sort((a, b) => Big(b.usdValue).minus(a.usdValue).toNumber());
		return rows;
	}, [perp, spot]);

	const totalValue = balances.reduce((acc, b) => acc.plus(b.usdValue), Big(0)).toString();

	function handleTransferClick(row: BalanceRow) {
		if (row.asset !== "USDC") return;
		const direction: TransferDirection = row.type === "perp" ? "toSpot" : "toPerp";
		setTransferState({
			open: true,
			direction,
			availableBalance: row.available,
		});
	}

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view balances.`}</Placeholder>;
		if (isLoading) return <Placeholder>{t`Loading balances...`}</Placeholder>;
		if (hasError) return <Placeholder variant="error">{t`Failed to load balances.`}</Placeholder>;
		if (balances.length === 0)
			return <Placeholder>{t`No balances found. Deposit funds to start trading.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-fg mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				{t`Account Balances`}
				<span className="text-positive ml-auto tabular-nums">
					{isConnected && !isLoading ? formatUSD(totalValue, { compact: true }) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-bg/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table className="w-auto min-w-full">
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7 w-[140px]">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7 w-[90px]">
										{t`Available`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7 w-[80px]">
										{t`In Use`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7 w-[90px]">
										{t`Total`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7 w-[90px]">
										{t`USD Value`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7 w-[80px]">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{balances.map((row) => {
									const displayName = getDisplayName(row.asset);
									const decimals = getDecimals(row.asset);
									const canTransfer = row.asset === "USDC" && Big(row.available).gt(0);
									const transferLabel = row.type === "perp" ? t`To Spot` : t`To Perp`;
									return (
										<TableRow key={`${row.type}-${row.asset}`} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<TokenAvatar symbol={displayName} />
													<span className="text-info">{displayName}</span>
													<span
														className={cn(
															"text-4xs px-1 py-0.5 uppercase",
															row.type === "perp" ? "bg-highlight/20 text-highlight" : "bg-warning/20 text-warning",
														)}
													>
														{row.type === "perp" ? t`perp` : t`spot`}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatToken(row.available, decimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-warning py-1.5">
												{formatToken(row.inOrder, decimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatToken(row.total, decimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-positive py-1.5">
												{formatUSD(row.usdValue, { compact: true })}
											</TableCell>
											<TableCell className="text-right py-1.5">
												{canTransfer && (
													<Button
														variant="ghost"
														size="none"
														onClick={() => handleTransferClick(row)}
														className="text-4xs text-info hover:text-info/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
													>
														<ArrowLeftRight className="size-2.5" />
														{transferLabel}
													</Button>
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

			<TransferDialog
				open={transferState.open}
				onOpenChange={(open) => setTransferState((prev) => ({ ...prev, open }))}
				direction={transferState.direction}
				availableBalance={transferState.availableBalance}
			/>
		</div>
	);
}
