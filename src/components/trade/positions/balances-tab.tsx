import { t } from "@lingui/core/macro";
import { ArrowsDownUpIcon, ArrowsLeftRightIcon, PaperPlaneTiltIcon, WalletIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/constants";
import {
	type BalanceRow,
	filterBalanceRowsByUsdValue,
	getBalanceRows,
	getTotalUsdValue,
} from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken, formatUSD } from "@/lib/format";
import { useSubAllMids } from "@/lib/hyperliquid/hooks/subscription";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { toNumberOrZero } from "@/lib/trade/numbers";
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
				variant === "error" ? "text-market-down-600" : "text-text-950",
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
	const [transferState, setTransferState] = useState<{
		open: boolean;
		direction: TransferDirection;
	}>({
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
	const { data: allMidsEvent } = useSubAllMids({ dex: HL_ALL_DEXS }, { enabled: isConnected });
	const mids = allMidsEvent?.mids;

	const balances = useMemo(() => getBalanceRows(perpSummary, spotBalances), [perpSummary, spotBalances]);

	function getPnl(row: BalanceRow): { pnl: number; pnlPercent: number } | null {
		if (row.type === "perp") return null;
		const entryNtl = toNumberOrZero(row.entryNtl);
		if (entryNtl === 0) return null;

		const midPx = toNumberOrZero(mids?.[row.asset]);
		if (midPx === 0) return null;

		const total = toNumberOrZero(row.total);
		const currentValue = total * midPx;
		const pnl = currentValue - entryNtl;
		const pnlPercent = (pnl / entryNtl) * 100;
		return { pnl, pnlPercent };
	}

	const filteredBalances = useMemo(() => {
		if (!hideSmallBalances) return balances;
		return filterBalanceRowsByUsdValue(balances, SMALL_BALANCE_THRESHOLD);
	}, [balances, hideSmallBalances]);

	const perpBalances = useMemo(() => filteredBalances.filter((row) => row.type === "perp"), [filteredBalances]);
	const spotBalancesFiltered = useMemo(() => filteredBalances.filter((row) => row.type === "spot"), [filteredBalances]);

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

	function renderBalanceRow(row: BalanceRow, index: number) {
		const token = getToken(row.asset);
		const decimals = token?.weiDecimals ?? 2;
		const canTransfer = row.asset === DEFAULT_QUOTE_TOKEN && parseFloat(row.available) > 0;
		const canSwap = row.type === "spot" && parseFloat(row.available) > 0;
		const transferLabel = row.type === "perp" ? t`To Spot` : t`To Perp`;
		const pnlData = getPnl(row);
		return (
			<TableRow
				key={`${row.type}-${row.asset}`}
				className={cn("border-border-200/40 hover:bg-surface-analysis/30", index % 2 === 1 && "bg-surface-analysis")}
			>
				<TableCell className="text-3xs font-medium py-1.5">
					<AssetDisplay asset={token ?? { displayName: row.asset, iconUrl: undefined }} />
				</TableCell>
				<TableCell className="text-3xs text-right tabular-nums py-1.5">
					{formatToken(row.available, decimals)}
				</TableCell>
				<TableCell className="text-3xs text-right tabular-nums text-text-950 py-1.5">
					{formatToken(row.inOrder, decimals)}
				</TableCell>
				<TableCell className="text-3xs text-right tabular-nums py-1.5">{formatToken(row.total, decimals)}</TableCell>
				<TableCell className="text-3xs text-right tabular-nums text-market-up-600 py-1.5">
					{formatUSD(row.usdValue, { compact: true })}
				</TableCell>
				<TableCell className="text-3xs text-right tabular-nums py-1.5">
					{pnlData ? (
						<span className={pnlData.pnl >= 0 ? "text-market-up-600" : "text-market-down-600"}>
							{pnlData.pnl >= 0 ? "+" : ""}
							{formatUSD(pnlData.pnl, { compact: true })} ({pnlData.pnlPercent >= 0 ? "+" : ""}
							{pnlData.pnlPercent.toFixed(1)}%)
						</span>
					) : (
						<span className="text-text-600">—</span>
					)}
				</TableCell>
				<TableCell className="text-right py-1.5">
					<div className="flex items-center justify-end gap-1">
						{canTransfer && (
							<Button
								variant="text"
								size="none"
								onClick={() => handleTransferClick(row)}
								className="text-4xs text-primary-default hover:text-primary-default/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
							>
								<ArrowsLeftRightIcon className="size-2.5" />
								{transferLabel}
							</Button>
						)}
						{canSwap && (
							<Button
								variant="text"
								size="none"
								onClick={() => openSwapModal(row.asset)}
								className="text-4xs text-primary-default hover:text-primary-default/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
							>
								<ArrowsDownUpIcon className="size-2.5" />
								{t`Swap`}
							</Button>
						)}
						{parseFloat(row.available) > 0 && (
							<Button
								variant="text"
								size="none"
								onClick={() => handleSendClick(row)}
								className="text-4xs text-primary-default hover:text-primary-default/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
							>
								<PaperPlaneTiltIcon className="size-2.5" />
								{t`Send`}
							</Button>
						)}
					</div>
				</TableCell>
			</TableRow>
		);
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
			<div className="text-3xs uppercase tracking-wider text-text-600 mb-1.5 flex items-center gap-2">
				<WalletIcon className="size-3" />
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
				<span className="text-market-up-600 tabular-nums">
					{isConnected && !isLoading ? formatUSD(totalValue, { compact: true }) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border-200/40 rounded-sm bg-surface-base/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table className="w-auto min-w-full">
							<TableHeader>
								<TableRow className="border-border-200/40 bg-surface-analysis hover:bg-surface-analysis">
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7 w-35">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-22.5">
										{t`Available`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-20">
										{t`In Use`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-22.5">
										{t`Total`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-22.5">
										{t`USD Value`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-25">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7 w-20">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{perpBalances.length > 0 && (
									<>
										<TableRow className="border-border-200/40 hover:bg-transparent">
											<TableCell
												colSpan={7}
												className="text-3xs uppercase tracking-wider text-primary-default bg-primary-default/5 py-1 font-medium"
											>
												{t`Perpetuals`}
											</TableCell>
										</TableRow>
										{perpBalances.map((row, i) => renderBalanceRow(row, i))}
									</>
								)}
								{spotBalancesFiltered.length > 0 && (
									<>
										<TableRow className="border-border-200/40 hover:bg-transparent">
											<TableCell
												colSpan={7}
												className="text-3xs uppercase tracking-wider text-warning-700 bg-warning-700/5 py-1 font-medium"
											>
												{t`Spot`}
											</TableCell>
										</TableRow>
										{spotBalancesFiltered.map((row, i) => renderBalanceRow(row, i))}
									</>
								)}
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
