import { Button, Checkbox } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsDownUpIcon, ArrowsLeftRightIcon, PaperPlaneTiltIcon, WalletIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
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
import { SendModal } from "../positions/send-modal";
import { TransferModal } from "../positions/transfer-modal";
import { MetricCell } from "./metric-cell";

type TransferDirection = "toSpot" | "toPerp";

interface Props {
	className?: string;
}

export function MobileBalancesTab({ className }: Props) {
	const { isConnected } = useConnection();
	const { getToken } = useMarkets();
	const hideSmallBalances = useHideSmallBalances();
	const { setHideSmallBalances } = useGlobalSettingsActions();
	const { open: openSwapModal } = useSwapModalActions();
	const [transferState, setTransferState] = useState<{ open: boolean; direction: TransferDirection }>({
		open: false,
		direction: "toSpot",
	});
	const [sendState, setSendState] = useState<{ open: boolean; asset: string; accountType: "perp" | "spot" }>({
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
	const filteredPerpBalances = useMemo(() => {
		if (!hideSmallBalances) return perpBalances;
		return filterBalanceRowsByUsdValue(perpBalances, SMALL_BALANCE_THRESHOLD_USD);
	}, [hideSmallBalances, perpBalances]);
	const filteredSpotBalances = useMemo(() => {
		if (!hideSmallBalances) return spotBalanceRows;
		return filterBalanceRowsByUsdValue(spotBalanceRows, SMALL_BALANCE_THRESHOLD_USD);
	}, [hideSmallBalances, spotBalanceRows]);

	const totalValue = useMemo(() => getTotalUsdValue(balances), [balances]);

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

	function handleTransferClick(row: BalanceRow) {
		if (row.asset !== DEFAULT_QUOTE_TOKEN) return;
		setTransferState({ open: true, direction: row.type === "perp" ? "toSpot" : "toPerp" });
	}

	function handleSendClick(row: BalanceRow) {
		setSendState({ open: true, asset: row.asset, accountType: row.type });
	}

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view balances.`}
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-error">
				{t`Failed to load balances.`}
			</div>
		);
	}

	if (!isLoading && balances.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`No balances found. Deposit funds to start trading.`}
			</div>
		);
	}

	function renderBalanceCard(row: BalanceRow) {
		const token = getToken(row.asset);
		const decimals = row.type === "perp" ? 2 : (token?.szDecimals ?? 2);
		const canTransfer = row.asset === DEFAULT_QUOTE_TOKEN && parseFloat(row.available) > 0;
		const canSwap = row.type === "spot" && parseFloat(row.available) > 0;
		const canSend = parseFloat(row.available) > 0;
		const transferLabel = row.type === "perp" ? t`To Spot` : t`To Perp`;
		const pnlData = getPnl(row);

		return (
			<div key={`${row.type}-${row.asset}`} className="rounded-xs border border-stroke-weak bg-surface overflow-hidden">
				<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
					<AssetDisplay coin={row.asset} nameClassName="text-sm font-semibold" />
					<div className="text-right">
						<div className="text-sm font-semibold tabular-nums text-fg">
							{formatUSD(row.usdValue, { compact: true })}
						</div>
						{pnlData && (
							<div className={cn("text-xs tabular-nums", pnlData.pnl >= 0 ? "text-success" : "text-error")}>
								{pnlData.pnl >= 0 ? "+" : ""}
								{formatUSD(pnlData.pnl, { compact: true })} ({pnlData.pnlPercent >= 0 ? "+" : ""}
								{pnlData.pnlPercent.toFixed(1)}%)
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 divide-x divide-stroke-weak">
					<MetricCell label={t`Available`} value={formatToken(row.available, decimals)} />
					<MetricCell label={t`Total`} value={formatToken(row.total, decimals)} />
				</div>

				{(canTransfer || canSwap || canSend) && (
					<div className="flex items-center gap-2 px-3 py-1.5">
						{canTransfer && (
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								className="touch-target"
								onClick={() => handleTransferClick(row)}
								iconLeft={<ArrowsLeftRightIcon className="size-3.5" />}
							>
								{transferLabel}
							</Button>
						)}
						{canSwap && (
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								className="touch-target"
								onClick={() => openSwapModal(row.asset)}
								iconLeft={<ArrowsDownUpIcon className="size-3.5" />}
							>
								{t`Swap`}
							</Button>
						)}
						{canSend && (
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								onClick={() => handleSendClick(row)}
								className="ml-auto touch-target"
								iconLeft={<PaperPlaneTiltIcon className="size-3.5" />}
							>
								{t`Send`}
							</Button>
						)}
					</div>
				)}
			</div>
		);
	}

	return (
		<Skeleton name="balances-tab" loading={isLoading}>
			<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-fg-muted">
					<WalletIcon className="size-3" />
					{t`Account Balances`}
					<span className="ml-auto normal-case tracking-normal">
						<Checkbox
							checked={hideSmallBalances}
							onCheckedChange={(checked: boolean | "indeterminate") => setHideSmallBalances(Boolean(checked))}
							size="sm"
							label={t`Hide small`}
						/>
					</span>
					<span className="text-success font-semibold tabular-nums">{formatUSD(totalValue, { compact: true })}</span>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{filteredPerpBalances.length > 0 && (
						<>
							<div className="text-xs uppercase tracking-wider text-brand font-medium px-1 pt-1">{t`Perpetuals`}</div>
							{filteredPerpBalances.map(renderBalanceCard)}
						</>
					)}
					{filteredSpotBalances.length > 0 && (
						<>
							<div className="text-xs uppercase tracking-wider text-warning font-medium px-1 pt-1">{t`Spot`}</div>
							{filteredSpotBalances.map(renderBalanceCard)}
						</>
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
		</Skeleton>
	);
}
