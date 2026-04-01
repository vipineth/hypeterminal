import { Button, SegmentedControlItem, SegmentedControls } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatPercent, formatToken, formatUSD } from "@/lib/format";
import { getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";

type SummaryRow = {
	label: string;
	value: string;
	valueClassName?: string;
};

export function AccountPanel() {
	const [activeTab, setActiveTab] = useState("perps");
	const { open: openDepositModal } = useDepositModalActions();

	const { isConnected } = useConnection();
	const { marginSummary, perpSummary, perpPositions, spotBalances, withdrawable, crossMaintenanceMarginUsed } =
		useAccountBalances();

	const perpMetrics = useMemo(() => {
		if (!marginSummary || !perpSummary) {
			return null;
		}

		const accountValue = toNumberOrZero(marginSummary.accountValue);
		const totalNtlPos = toNumberOrZero(perpSummary.totalNtlPos);
		const totalMarginUsed = toNumberOrZero(marginSummary.totalMarginUsed);
		const totalRawUsd = toNumberOrZero(marginSummary.totalRawUsd);
		const crossAccountValue = toNumberOrZero(perpSummary.accountValue);
		const maintenanceMargin = toNumberOrZero(crossMaintenanceMarginUsed);

		let unrealizedPnl = 0;
		for (const pos of perpPositions) {
			unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
		}

		const marginRatio = crossAccountValue > 0 ? maintenanceMargin / crossAccountValue : 0;
		const crossLeverage = crossAccountValue > 0 ? Math.abs(totalNtlPos) / crossAccountValue : 0;
		const availableBalance = toNumberOrZero(withdrawable);

		return {
			accountValue,
			totalRawUsd,
			unrealizedPnl,
			marginRatio,
			crossLeverage,
			availableBalance,
			totalMarginUsed,
		};
	}, [perpPositions, marginSummary, perpSummary, withdrawable, crossMaintenanceMarginUsed]);

	const spotMetrics = useMemo(() => {
		if (!isConnected) {
			return null;
		}

		let totalValue = 0;
		let availableValue = 0;
		let inOrderValue = 0;
		const tokens: Array<{ coin: string; total: number; available: number; usdValue: number }> = [];

		for (const b of spotBalances) {
			const total = toNumberOrZero(b.total);
			const hold = toNumberOrZero(b.hold);
			const entryNtl = toNumberOrZero(b.entryNtl);

			if (total === 0) continue;

			const available = Math.max(0, total - hold);
			const usdValue = b.coin === DEFAULT_QUOTE_TOKEN ? total : entryNtl;

			totalValue += usdValue;
			availableValue += b.coin === DEFAULT_QUOTE_TOKEN ? available : (available / total) * usdValue;
			inOrderValue += b.coin === DEFAULT_QUOTE_TOKEN ? hold : (hold / total) * usdValue;

			tokens.push({ coin: b.coin, total, available, usdValue });
		}

		tokens.sort((a, b) => b.usdValue - a.usdValue);

		return {
			totalValue,
			availableValue,
			inOrderValue,
			tokenCount: tokens.length,
			topTokens: tokens.slice(0, 3),
		};
	}, [isConnected, spotBalances]);

	const hasPerpData = isConnected && perpMetrics !== null;
	const hasSpotData = isConnected && spotMetrics !== null;

	function getHeaderEquity() {
		if (activeTab === "perps") {
			return hasPerpData ? formatUSD(perpMetrics.accountValue) : FALLBACK_VALUE_PLACEHOLDER;
		}
		return hasSpotData ? formatUSD(spotMetrics.totalValue) : FALLBACK_VALUE_PLACEHOLDER;
	}

	function getHeaderPnl() {
		if (activeTab === "perps" && hasPerpData) {
			return formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" });
		}
		return FALLBACK_VALUE_PLACEHOLDER;
	}

	const headerEquity = getHeaderEquity();
	const headerPnl = getHeaderPnl();

	const headerPnlClass =
		activeTab === "perps" && hasPerpData ? getValueColorClass(perpMetrics.unrealizedPnl) : "text-text-strong";

	const perpRows = useMemo((): SummaryRow[] => {
		if (!perpMetrics) return [];
		return [
			{
				label: t`Balance`,
				value: formatUSD(perpMetrics.totalRawUsd),
				valueClassName: "tabular-nums text-text-success",
			},
			{
				label: t`Unrealized PNL`,
				value: formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
				valueClassName: cn("tabular-nums", getValueColorClass(perpMetrics.unrealizedPnl)),
			},
			{
				label: t`Available`,
				value: formatUSD(perpMetrics.availableBalance),
				valueClassName: "tabular-nums",
			},
			{
				label: t`Margin Used`,
				value: formatUSD(perpMetrics.totalMarginUsed),
				valueClassName: "tabular-nums",
			},
			{
				label: t`Margin Ratio`,
				value: formatPercent(perpMetrics.marginRatio, { maximumFractionDigits: 1 }),
				valueClassName: "tabular-nums",
			},
			{
				label: t`Cross Leverage`,
				value: `${perpMetrics.crossLeverage.toFixed(2)}x`,
				valueClassName: "tabular-nums",
			},
		];
	}, [perpMetrics]);

	const spotRows = useMemo((): SummaryRow[] => {
		if (!spotMetrics) return [];
		return [
			{
				label: t`Total Value`,
				value: formatUSD(spotMetrics.totalValue),
				valueClassName: "tabular-nums",
			},
			{
				label: t`Available`,
				value: formatUSD(spotMetrics.availableValue),
				valueClassName: "tabular-nums",
			},
			{
				label: t`In Orders`,
				value: formatUSD(spotMetrics.inOrderValue),
				valueClassName: "tabular-nums text-text-warning",
			},
			{
				label: t`Assets`,
				value: `${spotMetrics.tokenCount}`,
				valueClassName: "tabular-nums",
			},
			...spotMetrics.topTokens.map((token) => ({
				label: token.coin,
				value: formatToken(token.total, token.coin === DEFAULT_QUOTE_TOKEN ? 2 : 4),
				valueClassName: "tabular-nums",
			})),
		];
	}, [spotMetrics]);

	return (
		<div className="shrink-0 flex flex-col bg-bg-overlay border-t border-stroke-weak mb-10 overflow-hidden">
			<div className="px-2 py-2 border-b border-stroke-weak flex items-center justify-between">
				<span className="text-xs text-text-strong">{t`Account`}</span>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<span className="text-xs text-text-strong">{t`Equity`}</span>
						<span
							className={cn(
								"text-xs font-medium tabular-nums",
								(activeTab === "perps" ? hasPerpData : hasSpotData) ? "text-text-success" : "text-text-strong",
							)}
						>
							{headerEquity}
						</span>
					</div>
					{activeTab === "perps" && (
						<div className="flex items-center gap-1">
							<span className="text-xs text-text-strong">{t`PNL`}</span>
							<span className={cn("text-xs font-medium tabular-nums", headerPnlClass)}>{headerPnl}</span>
						</div>
					)}
				</div>
			</div>

			<SegmentedControls value={activeTab} onValueChange={setActiveTab} fullWidth className="mx-2 mt-2">
				<SegmentedControlItem value="perps">{t`Perps`}</SegmentedControlItem>
				<SegmentedControlItem value="spot">{t`Spot`}</SegmentedControlItem>
			</SegmentedControls>

			{!isConnected ? (
				<div className="text-xs text-text-weak text-center py-4">{t`Connect wallet to view account`}</div>
			) : (
				<div className="p-2 overflow-y-auto">
					{activeTab === "perps" &&
						(hasPerpData ? (
							<InfoRowGroup className="divide-stroke-weak/30">
								{perpRows.map((row) => (
									<InfoRow key={row.label} label={row.label} value={row.value} valueClassName={row.valueClassName} />
								))}
							</InfoRowGroup>
						) : (
							<div className="text-xs text-text-weak text-center py-4">{t`Loading...`}</div>
						))}
					{activeTab === "spot" &&
						(hasSpotData ? (
							<InfoRowGroup className="divide-stroke-weak/30">
								{spotRows.map((row) => (
									<InfoRow key={row.label} label={row.label} value={row.value} valueClassName={row.valueClassName} />
								))}
							</InfoRowGroup>
						) : (
							<div className="text-xs text-text-weak text-center py-4">{t`Loading...`}</div>
						))}

					{(hasPerpData || hasSpotData) && (
						<div className="grid grid-cols-3 gap-1 mt-4">
							<Button
								variant="outline"
								intent="neutral"
								onClick={() => openDepositModal("withdraw")}
								aria-label={t`Withdraw`}
								iconLeft={<UploadSimpleIcon className="size-4" />}
							>
								{t`Withdraw`}
							</Button>
							<Button
								variant="outline"
								intent="neutral"
								onClick={() => openDepositModal("deposit")}
								aria-label={t`Deposit`}
								iconLeft={<DownloadSimpleIcon className="size-4" />}
							>
								{t`Deposit`}
							</Button>
							<Button
								variant="outline"
								intent="neutral"
								onClick={() => openDepositModal("bridge")}
								aria-label={t`Bridge`}
								iconLeft={<ArrowsLeftRightIcon className="size-4" />}
							>
								{t`Bridge`}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
