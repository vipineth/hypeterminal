import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { getAccountSummary, type PerpsOverview } from "@/domain/trade/balances";
import { useAccountState } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { AccountNoticeLine } from "../components/account-notice-line";
import { PerpsSourceLabel } from "../components/perps-source-label";

interface SummaryRow {
	label: string;
	value: string;
	valueClassName?: string;
}

function getPerpsRows(perps: PerpsOverview): SummaryRow[] {
	if (perps.kind === "spot") {
		const symbol = perps.token.displayName;
		return [
			{ label: t`Total`, value: formatToken(perps.total, { decimals: 2, symbol }), valueClassName: "tabular-nums" },
			{
				label: t`Available`,
				value: formatToken(perps.available, { decimals: 2, symbol }),
				valueClassName: "tabular-nums",
			},
		];
	}
	const { metrics } = perps;
	return [
		{ label: t`Balance`, value: formatUSD(metrics.balance), valueClassName: "tabular-nums" },
		{
			label: t`Unrealized PNL`,
			value: formatUSD(metrics.unrealizedPnl, { signDisplay: "exceptZero" }),
			valueClassName: cn("tabular-nums", getValueColorClass(metrics.unrealizedPnl)),
		},
		{
			label: t`Cross Margin Ratio`,
			value: formatPercent(metrics.marginRatio, { maximumFractionDigits: 2 }),
			valueClassName: "tabular-nums",
		},
		{ label: t`Maintenance Margin`, value: formatUSD(metrics.maintenanceMargin), valueClassName: "tabular-nums" },
		{
			label: t`Cross Account Leverage`,
			value: `${formatNumber(metrics.crossLeverage, 2)}x`,
			valueClassName: "tabular-nums",
		},
	];
}

export function AccountPanel() {
	const { open: openDepositModal } = useDepositModalActions();
	const { isConnected } = useConnection();
	const account = useAccountState();
	const { data: market } = useSelectedMarketInfo();
	const summary = getAccountSummary(account, market);
	const ready = summary.status === "ready" ? summary : null;

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
							value={ready ? formatUSD(ready.spotEquity) : FALLBACK_VALUE_PLACEHOLDER}
							valueClassName="tabular-nums"
						/>
						{ready?.perpsEquity !== null && (
							<InfoRow
								label={t`Perps`}
								value={ready ? formatUSD(ready.perpsEquity) : FALLBACK_VALUE_PLACEHOLDER}
								valueClassName="tabular-nums"
							/>
						)}
					</InfoRowGroup>

					{ready && (
						<>
							<p className="flex items-baseline justify-between gap-2 text-xs font-medium text-fg mt-3 mb-1">
								{t`Perps Overview`}
								<PerpsSourceLabel place={ready.perps.place} token={ready.perps.token} className="text-fg-muted" />
							</p>
							{ready.perps.notice && (
								<AccountNoticeLine notice={ready.perps.notice} token={ready.perps.token} className="mb-1 px-2" />
							)}
							<InfoRowGroup className="divide-y-0">
								{getPerpsRows(ready.perps).map((row) => (
									<InfoRow key={row.label} label={row.label} value={row.value} valueClassName={row.valueClassName} />
								))}
							</InfoRowGroup>
						</>
					)}

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
				</div>
			)}
		</div>
	);
}
