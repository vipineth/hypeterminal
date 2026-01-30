import { t } from "@lingui/core/macro";
import { ArrowDownUp, ArrowLeftRight, Send, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import {
	type BalanceRow,
	filterBalanceRowsByUsdValue,
	getBalanceRows,
	getTotalUsdValue,
} from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken, formatUSD } from "@/lib/format";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { useSwapModalActions } from "@/stores/use-global-modal-store";
import { useGlobalSettingsActions, useHideSmallBalances } from "@/stores/use-global-settings-store";
import { AssetDisplay } from "../components/asset-display";
import { SendDialog } from "./send-dialog";
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

type TransferDirection = "toSpot" | "toPerp";

const SMALL_BALANCE_THRESHOLD = 1;

export function BalancesTab() {
	const { isConnected } = useConnection();
	const { getToken } = useSpotTokens();
	const hideSmallBalances = useHideSmallBalances();
	const { setHideSmallBalances } = useGlobalSettingsActions();
	const { open: openSwapModal } = useSwapModalActions();
	const [transferState, setTransferState] = useState<{ open: boolean; direction: TransferDirection }>({
		open: false,
		direction: "toSpot",
	});
	const [sendState, setSendState] = useState<{
		open: boolean;
		asset: string;
		accountType: "perp" | "spot";
	}>({
		open: false,
		asset: DEFAULT_QUOTE_TOKEN,
		accountType: "spot",
	});

	const { perpSummary, spotBalances, isLoading, hasError } = useAccountBalances();

	const balances = useMemo(() => getBalanceRows(perpSummary, spotBalances), [perpSummary, spotBalances]);

	const filteredBalances = useMemo(() => {
		if (!hideSmallBalances) return balances;
		return filterBalanceRowsByUsdValue(balances, SMALL_BALANCE_THRESHOLD);
	}, [balances, hideSmallBalances]);

	const totalValue = useMemo(() => getTotalUsdValue(balances), [balances]);

	function handleTransferClick(row: BalanceRow) {
		if (row.asset !== DEFAULT_QUOTE_TOKEN) return;
		const direction: TransferDirection = row.type === "perp" ? "toSpot" : "toPerp";
		setTransferState({
			open: true,
			direction,
		});
	}

	function handleSendClick(row: BalanceRow) {
		setSendState({
			open: true,
			asset: row.asset,
			accountType: row.type,
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
				<label
					htmlFor="hideSmallBalances"
					className="ml-auto flex items-center gap-1.5 cursor-pointer text-4xs normal-case tracking-normal"
				>
					<Checkbox
						checked={hideSmallBalances}
						onCheckedChange={(checked) => setHideSmallBalances(Boolean(checked))}
						className="size-3"
					/>
					{t`Hide small`}
				</label>
				<span className="text-positive tabular-nums">
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
								{filteredBalances.map((row) => {
									const token = getToken(row.asset);
									const decimals = token?.transferDecimals ?? 2;
									const canTransfer = row.asset === DEFAULT_QUOTE_TOKEN && parseFloat(row.available) > 0;
									const canSwap = row.type === "spot" && parseFloat(row.available) > 0;
									const transferLabel = row.type === "perp" ? t`To Spot` : t`To Perp`;
									return (
										<TableRow key={`${row.type}-${row.asset}`} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<AssetDisplay asset={token ?? { displayName: row.asset, iconUrl: undefined }} />
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
												<div className="flex items-center justify-end gap-1">
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
													{canSwap && (
														<Button
															variant="ghost"
															size="none"
															onClick={() => openSwapModal(row.asset)}
															className="text-4xs text-info hover:text-info/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
														>
															<ArrowDownUp className="size-2.5" />
															{t`Swap`}
														</Button>
													)}
													{parseFloat(row.available) > 0 && (
														<Button
															variant="ghost"
															size="none"
															onClick={() => handleSendClick(row)}
															className="text-4xs text-info hover:text-info/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
														>
															<Send className="size-2.5" />
															{t`Send`}
														</Button>
													)}
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

			<TransferDialog
				open={transferState.open}
				onOpenChange={(open) => setTransferState((prev) => ({ ...prev, open }))}
				initialDirection={transferState.direction}
			/>

			<SendDialog
				open={sendState.open}
				onOpenChange={(open) => setSendState((prev) => ({ ...prev, open }))}
				initialAsset={sendState.asset}
				initialAccountType={sendState.accountType}
			/>
		</div>
	);
}
