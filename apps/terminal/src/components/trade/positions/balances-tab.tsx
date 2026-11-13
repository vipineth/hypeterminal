import { Button, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsDownUpIcon, ArrowsLeftRightIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DEFAULT_QUOTE_TOKEN, HL_ALL_DEXS } from "@/config/app";
import { SMALL_BALANCE_THRESHOLD_USD } from "@/config/trade";
import {
	type BalanceRow,
	filterBalanceRowsByUsdValue,
	getPerpBalanceRows,
	getSpotBalanceRows,
	getTotalUsdValue,
} from "@/domain/trade/balances";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken, formatUSD } from "@/lib/format";
import { useSubscription } from "@/lib/hyperliquid";
import { useMarkets } from "@/lib/hyperliquid/markets/use-markets";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useSwapModalActions } from "@/stores/use-global-modal-store";
import { useGlobalSettingsActions, useHideSmallBalances } from "@/stores/use-global-settings-store";
import { AssetDisplay } from "../components/asset-display";
import { Placeholder } from "./placeholder";
import {
	positionsPanelRowHoverClass,
	positionsPanelRowStripeClass,
	positionsPanelTableBodyClass,
	positionsPanelTableCaptionRowClass,
	positionsPanelTableCellClass,
	positionsPanelTableHeadClass,
	positionsPanelTableHeaderClass,
	positionsPanelTableHeaderRowClass,
	positionsPanelTableShellClass,
	positionsPanelTabRootClass,
} from "./positions-panel-table-styles";
import { SendModal } from "./send-modal";
import { TransferModal } from "./transfer-modal";

type TransferDirection = "toSpot" | "toPerp";

export function BalancesTab() {
	const { isConnected } = useConnection();
	const { getToken } = useMarkets();
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

	const { perpSummary, spotBalances, spotAvailableAfterMaintenance, accountAbstraction, isLoading, hasError } =
		useDefaultDexBalances();
	const { data: allMidsEvent } = useSubscription("allMids", { dex: HL_ALL_DEXS }, { enabled: isConnected });
	const mids = allMidsEvent?.mids;

	const perpBalances = useMemo(
		() => getPerpBalanceRows(perpSummary, spotBalances, spotAvailableAfterMaintenance, accountAbstraction),
		[accountAbstraction, perpSummary, spotBalances, spotAvailableAfterMaintenance],
	);
	const spotBalanceRows = useMemo(
		() => getSpotBalanceRows(spotBalances, spotAvailableAfterMaintenance, accountAbstraction),
		[accountAbstraction, spotBalances, spotAvailableAfterMaintenance],
	);
	const balances = useMemo(() => [...perpBalances, ...spotBalanceRows], [perpBalances, spotBalanceRows]);

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

	const filteredPerpBalances = useMemo(() => {
		if (!hideSmallBalances) return perpBalances;
		return filterBalanceRowsByUsdValue(perpBalances, SMALL_BALANCE_THRESHOLD_USD);
	}, [hideSmallBalances, perpBalances]);

	const filteredSpotBalances = useMemo(() => {
		if (!hideSmallBalances) return spotBalanceRows;
		return filterBalanceRowsByUsdValue(spotBalanceRows, SMALL_BALANCE_THRESHOLD_USD);
	}, [hideSmallBalances, spotBalanceRows]);

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
		const decimals = row.type === "perp" ? 2 : (token?.szDecimals ?? 2);
		const canTransfer = row.asset === DEFAULT_QUOTE_TOKEN && parseFloat(row.available) > 0;
		const canSwap = row.type === "spot" && parseFloat(row.available) > 0;
		const transferLabel = row.type === "perp" ? t`To Spot` : t`To Perp`;
		const pnlData = getPnl(row);
		return (
			<TableRow
				key={`${row.type}-${row.asset}`}
				className={cn(positionsPanelRowHoverClass, index % 2 === 1 && positionsPanelRowStripeClass)}
			>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "font-medium text-fg")}>
					<AssetDisplay coin={row.asset} />
				</TableCell>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}>
					{formatToken(row.available, decimals)}
				</TableCell>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}>
					{formatToken(row.total, decimals)}
				</TableCell>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-success")}>
					{formatUSD(row.usdValue, { compact: true })}
				</TableCell>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}>
					{pnlData ? (
						<span className={pnlData.pnl >= 0 ? "text-success" : "text-error"}>
							{pnlData.pnl >= 0 ? "+" : ""}
							{formatUSD(pnlData.pnl, { compact: true })} ({pnlData.pnlPercent >= 0 ? "+" : ""}
							{pnlData.pnlPercent.toFixed(1)}%)
						</span>
					) : (
						<span className="text-fg-muted">—</span>
					)}
				</TableCell>
				<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right")}>
					<div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
						{canTransfer && (
							<Button
								variant="link"
								onClick={() => handleTransferClick(row)}
								className="shrink-0 text-xs text-brand hover:text-brand/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
							>
								<ArrowsLeftRightIcon className="size-2.5" />
								{transferLabel}
							</Button>
						)}
						{canSwap && (
							<Button
								variant="link"
								onClick={() => openSwapModal(row.asset)}
								className="shrink-0 text-xs text-brand hover:text-brand/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
							>
								<ArrowsDownUpIcon className="size-2.5" />
								{t`Swap`}
							</Button>
						)}
						{parseFloat(row.available) > 0 && (
							<Button
								variant="link"
								onClick={() => handleSendClick(row)}
								className="shrink-0 text-xs text-brand hover:text-brand/80 hover:bg-transparent px-1.5 py-0.5 gap-1"
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
		<div className={positionsPanelTabRootClass}>
			<div className={positionsPanelTableCaptionRowClass}>
				<Checkbox
					size="xxs"
					checked={hideSmallBalances}
					onCheckedChange={(checked: boolean | "indeterminate") => setHideSmallBalances(Boolean(checked))}
					label={
						<span className="text-3xs font-normal normal-case tracking-normal text-fg-muted">{t`Hide small`}</span>
					}
					className="gap-1.5 items-center"
				/>
				{isConnected && !isLoading ? (
					<span className="tabular-nums text-3xs font-medium text-success">
						{formatUSD(totalValue, { compact: true })}
					</span>
				) : null}
			</div>
			<div className={positionsPanelTableShellClass}>
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table className="table-fixed min-w-[44rem] w-full">
							<TableHeader className={positionsPanelTableHeaderClass}>
								<TableRow className={positionsPanelTableHeaderRowClass}>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[20%] text-left")}>
										{t`Asset`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[14%] text-right")}
									>
										{t`Available`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[14%] text-right")}
									>
										{t`Total`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[16%] text-right")}
									>
										{t`USD Value`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[16%] text-right")}
									>
										{t`PNL`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[20%] text-right")}
									>
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className={positionsPanelTableBodyClass}>
								{filteredPerpBalances.length > 0 && (
									<>
										<TableRow className="border-stroke-weak/40 hover:bg-transparent">
											<TableCell
												colSpan={6}
												className="!h-auto !min-h-0 border-stroke-weak/40 bg-brand/8 px-2.5 py-1.5 text-3xs font-semibold uppercase tracking-widest text-brand"
											>
												{t`Perpetuals`}
											</TableCell>
										</TableRow>
										{filteredPerpBalances.map((row, i) => renderBalanceRow(row, i))}
									</>
								)}
								{filteredSpotBalances.length > 0 && (
									<>
										<TableRow className="border-stroke-weak/40 hover:bg-transparent">
											<TableCell
												colSpan={6}
												className="!h-auto !min-h-0 border-stroke-weak/40 bg-warning/8 px-2.5 py-1.5 text-3xs font-semibold uppercase tracking-widest text-warning"
											>
												{t`Spot`}
											</TableCell>
										</TableRow>
										{filteredSpotBalances.map((row, i) => renderBalanceRow(row, i))}
									</>
								)}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>

			<TransferModal
				open={transferState.open}
				onOpenChange={(open) => setTransferState((prev) => ({ ...prev, open }))}
				initialDirection={transferState.direction}
			/>

			<SendModal
				open={sendState.open}
				onOpenChange={(open) => setSendState((prev) => ({ ...prev, open }))}
				initialAsset={sendState.asset}
				initialAccountType={sendState.accountType}
			/>
		</div>
	);
}
