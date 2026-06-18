import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { getSpotAvailableValue } from "@/domain/trade/balances";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useDepositModalActions } from "@/stores/use-global-modal-store";

type SummaryRow = {
	label: string;
	value: string;
	valueClassName?: string;
};

export function AccountPanel() {
	const { open: openDepositModal } = useDepositModalActions();
	const { isConnected } = useConnection();
	const {
		marginSummary,
		perpSummary,
		perpPositions,
		spotBalances,
		spotAvailableAfterMaintenance,
		crossMaintenanceMarginUsed,
	} = useDefaultDexBalances();

	let perpMetrics = null;
	if (marginSummary && perpSummary) {
		const crossAccountValue = toNumberOrZero(perpSummary.accountValue);
		const crossTotalNtlPos = toNumberOrZero(perpSummary.totalNtlPos);
		const maintenanceMargin = toNumberOrZero(crossMaintenanceMarginUsed);

		let unrealizedPnl = 0;
		for (const pos of perpPositions) {
			unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
		}

		const balance = crossAccountValue - unrealizedPnl;
		const marginRatio = crossAccountValue > 0 ? maintenanceMargin / crossAccountValue : 0;
		const crossLeverage = crossAccountValue > 0 ? Math.abs(crossTotalNtlPos) / crossAccountValue : 0;

		perpMetrics = {
			accountValue: crossAccountValue,
			balance,
			unrealizedPnl,
			marginRatio,
			crossLeverage,
			maintenanceMargin,
		};
	}

	let spotMetrics = null;
	if (isConnected) {
		let totalValue = 0;
		const tokens: Array<{ coin: string; total: number; available: number; usdValue: number }> = [];

		for (const b of spotBalances) {
			const total = toNumberOrZero(b.total);
			const entryNtl = toNumberOrZero(b.entryNtl);

			if (total === 0) continue;

			const available = toNumberOrZero(getSpotAvailableValue(b, spotAvailableAfterMaintenance));
			const usdValue = b.coin === DEFAULT_QUOTE_TOKEN ? total : entryNtl;

			totalValue += usdValue;
			tokens.push({ coin: b.coin, total, available, usdValue });
		}

		tokens.sort((a, b) => b.usdValue - a.usdValue);
		spotMetrics = { totalValue, topTokens: tokens.slice(0, 3) };
	}

	const hasPerpData = isConnected && perpMetrics !== null;
	const hasSpotData = isConnected && spotMetrics !== null;

	const perpRows: SummaryRow[] = perpMetrics
		? [
				{
					label: t`Balance`,
					value: formatUSD(perpMetrics.balance),
					valueClassName: "tabular-nums",
				},
				{
					label: t`Unrealized PNL`,
					value: formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
					valueClassName: cn("tabular-nums", getValueColorClass(perpMetrics.unrealizedPnl)),
				},
				{
					label: t`Cross Margin Ratio`,
					value: formatPercent(perpMetrics.marginRatio, { maximumFractionDigits: 2 }),
					valueClassName: "tabular-nums",
				},
				{
					label: t`Maintenance Margin`,
					value: formatUSD(perpMetrics.maintenanceMargin),
					valueClassName: "tabular-nums",
				},
				{
					label: t`Cross Account Leverage`,
					value: `${perpMetrics.crossLeverage.toFixed(2)}x`,
					valueClassName: "tabular-nums",
				},
			]
		: [];

	return (
		<div className="shrink-0 flex flex-col bg-surface border-t border-stroke-weak pb-6 overflow-hidden">
			<div className="px-2 py-2 border-b border-stroke-weak">
				<span className="text-xs font-medium text-fg-muted uppercase tracking-wide">{t`Account`}</span>
			</div>

			{!isConnected ? (
				<div className="text-xs text-fg-muted text-center py-4">{t`Connect wallet to view account`}</div>
			) : (
				<div className="p-2 overflow-y-auto">
					<p className="text-xs font-medium text-fg mb-1">{t`Account Equity`}</p>
					<InfoRowGroup className="divide-y-0">
						<InfoRow
							label={t`Spot`}
							value={spotMetrics ? formatUSD(spotMetrics.totalValue) : FALLBACK_VALUE_PLACEHOLDER}
							valueClassName="tabular-nums"
						/>
						<InfoRow
							label={t`Perps`}
							value={perpMetrics ? formatUSD(perpMetrics.accountValue) : FALLBACK_VALUE_PLACEHOLDER}
							valueClassName="tabular-nums"
						/>
					</InfoRowGroup>

					{hasPerpData && (
						<>
							<p className="text-xs font-medium text-fg mt-3 mb-1">{t`Perps Overview`}</p>
							<InfoRowGroup className="divide-y-0">
								{perpRows.map((row) => (
									<InfoRow key={row.label} label={row.label} value={row.value} valueClassName={row.valueClassName} />
								))}
							</InfoRowGroup>
						</>
					)}

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
