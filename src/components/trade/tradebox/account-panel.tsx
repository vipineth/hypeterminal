import { t } from "@lingui/core/macro";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { InfoRow } from "@/components/ui/info-row";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	const { perpSummary, perpPositions, spotBalances } = useAccountBalances();

	const perpMetrics = useMemo(() => {
		if (!perpSummary) {
			return null;
		}

		const accountValue = toNumberOrZero(perpSummary.accountValue);
		const totalNtlPos = toNumberOrZero(perpSummary.totalNtlPos);
		const totalMarginUsed = toNumberOrZero(perpSummary.totalMarginUsed);
		const totalRawUsd = toNumberOrZero(perpSummary.totalRawUsd);

		let unrealizedPnl = 0;
		for (const pos of perpPositions) {
			unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
		}

		const marginRatio = accountValue > 0 ? totalMarginUsed / accountValue : 0;

		const crossLeverage = accountValue > 0 ? Math.abs(totalNtlPos) / accountValue : 0;

		const availableBalance = Math.max(0, accountValue - totalMarginUsed);

		return {
			accountValue,
			totalRawUsd,
			unrealizedPnl,
			marginRatio,
			crossLeverage,
			availableBalance,
			totalMarginUsed,
		};
	}, [perpPositions, perpSummary]);

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

	const headerEquity =
		activeTab === "perps"
			? hasPerpData
				? formatUSD(perpMetrics.accountValue)
				: FALLBACK_VALUE_PLACEHOLDER
			: hasSpotData
				? formatUSD(spotMetrics.totalValue)
				: FALLBACK_VALUE_PLACEHOLDER;

	const headerPnl =
		activeTab === "perps"
			? hasPerpData
				? formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" })
				: FALLBACK_VALUE_PLACEHOLDER
			: FALLBACK_VALUE_PLACEHOLDER;

	const headerPnlClass =
		activeTab === "perps" && hasPerpData ? getValueColorClass(perpMetrics.unrealizedPnl) : "text-text-950";

	const perpRows = useMemo((): SummaryRow[] => {
		if (!perpMetrics) return [];
		return [
			{
				label: t`Balance`,
				value: formatUSD(perpMetrics.totalRawUsd),
				valueClassName: "tabular-nums text-market-up-600",
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
				valueClassName: "tabular-nums text-warning-700",
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

	const summaryRows = activeTab === "perps" ? perpRows : spotRows;
	const hasData = activeTab === "perps" ? hasPerpData : hasSpotData;

	return (
		<div className="shrink-0 flex flex-col bg-surface-execution border-t border-border-200 mb-10">
			<div className="px-2 py-2 border-b border-border-200 flex items-center justify-between">
				<span className="text-3xs text-text-950">{t`Account`}</span>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<span className="text-3xs text-text-950">{t`Equity`}</span>
						<span className={cn("text-3xs font-medium tabular-nums", hasData ? "text-market-up-600" : "text-text-950")}>
							{headerEquity}
						</span>
					</div>
					{activeTab === "perps" && (
						<div className="flex items-center gap-1">
							<span className="text-3xs text-text-950">{t`PNL`}</span>
							<span className={cn("text-3xs font-medium tabular-nums", headerPnlClass)}>{headerPnl}</span>
						</div>
					)}
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<div className="px-2 border-b border-border-200">
					<TabsList variant="underline">
						<TabsTrigger value="perps">{t`Perps`}</TabsTrigger>
						<TabsTrigger value="spot">{t`Spot`}</TabsTrigger>
					</TabsList>
				</div>

				<div className="p-2 space-y-2 overflow-y-auto">
					{!isConnected ? (
						<div className="text-2xs text-text-600 text-center py-4">{t`Connect wallet to view account`}</div>
					) : !hasData ? (
						<div className="text-2xs text-text-600 text-center py-4">{t`Loading...`}</div>
					) : (
						<>
							<div className="divide-y divide-border-200 text-2xs tracking-[0.5px]">
								{summaryRows.map((row) => (
									<InfoRow key={row.label} label={row.label} value={row.value} valueClassName={row.valueClassName} />
								))}
							</div>

							<div className="grid grid-cols-2 gap-1">
								<Button variant="outlined" onClick={() => openDepositModal("withdraw")} aria-label={t`Withdraw`}>
									<UploadSimpleIcon className="size-4" />
									{t`Withdraw`}
								</Button>
								<Button variant="outlined" onClick={() => openDepositModal("deposit")} aria-label={t`Deposit`}>
									<DownloadSimpleIcon className="size-4" />
									{t`Deposit`}
								</Button>
							</div>
						</>
					)}
				</div>
			</Tabs>
		</div>
	);
}
