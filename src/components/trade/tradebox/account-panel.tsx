import { t } from "@lingui/core/macro";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatPercent, formatToken, formatUSD } from "@/lib/format";
import { getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";

type SummaryRow = {
	label: string;
	value: string;
	valueClass: string;
};

export function AccountPanel() {
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");
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
		activeTab === "perps" && hasPerpData ? getValueColorClass(perpMetrics.unrealizedPnl) : "text-muted-fg";

	const perpRows = useMemo((): SummaryRow[] => {
		if (!perpMetrics) return [];
		return [
			{
				label: t`Balance`,
				value: formatUSD(perpMetrics.totalRawUsd),
				valueClass: "tabular-nums",
			},
			{
				label: t`Unrealized PNL`,
				value: formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
				valueClass: cn("tabular-nums", getValueColorClass(perpMetrics.unrealizedPnl)),
			},
			{
				label: t`Available`,
				value: formatUSD(perpMetrics.availableBalance),
				valueClass: "tabular-nums",
			},
			{
				label: t`Margin Used`,
				value: formatUSD(perpMetrics.totalMarginUsed),
				valueClass: "tabular-nums",
			},
			{
				label: t`Margin Ratio`,
				value: formatPercent(perpMetrics.marginRatio, { maximumFractionDigits: 1 }),
				valueClass: "tabular-nums",
			},
			{
				label: t`Cross Leverage`,
				value: `${perpMetrics.crossLeverage.toFixed(2)}x`,
				valueClass: "tabular-nums font-medium",
			},
		];
	}, [perpMetrics]);

	const spotRows = useMemo((): SummaryRow[] => {
		if (!spotMetrics) return [];
		return [
			{
				label: t`Total Value`,
				value: formatUSD(spotMetrics.totalValue),
				valueClass: "tabular-nums",
			},
			{
				label: t`Available`,
				value: formatUSD(spotMetrics.availableValue),
				valueClass: "tabular-nums",
			},
			{
				label: t`In Orders`,
				value: formatUSD(spotMetrics.inOrderValue),
				valueClass: "tabular-nums text-warning",
			},
			{
				label: t`Assets`,
				value: `${spotMetrics.tokenCount}`,
				valueClass: "tabular-nums",
			},
			...spotMetrics.topTokens.map((token) => ({
				label: token.coin,
				value: formatToken(token.total, token.coin === DEFAULT_QUOTE_TOKEN ? 2 : 4),
				valueClass: "tabular-nums",
			})),
		];
	}, [spotMetrics]);

	const summaryRows = activeTab === "perps" ? perpRows : spotRows;
	const hasData = activeTab === "perps" ? hasPerpData : hasSpotData;

	return (
		<div className="shrink-0 flex flex-col relative bg-linear-to-b from-surface to-bg border-t border-info/20">
			<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-info/40 to-transparent" />
			<div className="px-2 py-2 border-b border-border/40 flex items-center justify-between backdrop-blur-sm">
				<span className="text-3xs uppercase tracking-wider text-info/70">{t`Account`}</span>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<span className="text-4xs text-muted-fg uppercase">{t`Equity`}</span>
						<span className={cn("text-sm font-semibold tabular-nums", hasData ? "text-positive" : "text-muted-fg")}>
							{headerEquity}
						</span>
					</div>
					{activeTab === "perps" && (
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-fg uppercase">{t`PNL`}</span>
							<span className={cn("text-2xs font-medium tabular-nums", headerPnlClass)}>{headerPnl}</span>
						</div>
					)}
				</div>
			</div>

			<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
				<Button
					variant="text"
					size="none"
					onClick={() => setActiveTab("perps")}
					className={cn(
						"px-2 py-1 text-4xs uppercase tracking-wider hover:bg-transparent",
						activeTab === "perps" ? "text-fg border-b border-fg" : "text-muted-fg hover:text-fg",
					)}
					aria-label={t`Perps`}
				>
					{t`Perps`}
				</Button>
				<Button
					variant="text"
					size="none"
					onClick={() => setActiveTab("spot")}
					className={cn(
						"px-2 py-1 text-4xs uppercase tracking-wider hover:bg-transparent",
						activeTab === "spot" ? "text-fg border-b border-fg" : "text-muted-fg hover:text-fg",
					)}
					aria-label={t`Spot`}
				>
					{t`Spot`}
				</Button>
			</div>

			<div className="p-2 space-y-2 overflow-y-auto">
				{!isConnected ? (
					<div className="text-3xs text-muted-fg text-center py-4">{t`Connect wallet to view account`}</div>
				) : !hasData ? (
					<div className="text-3xs text-muted-fg text-center py-4">{t`Loading...`}</div>
				) : (
					<>
						<div className="border border-info/10 bg-bg divide-y divide-border/30 text-3xs">
							{summaryRows.map((row) => (
								<div key={row.label} className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-fg">{row.label}</span>
									<span className={row.valueClass}>{row.value}</span>
								</div>
							))}
						</div>

						<div className="grid grid-cols-2 gap-1">
							<Button
								variant="text"
								size="none"
								onClick={() => openDepositModal("deposit")}
								className="py-1.5 text-3xs uppercase tracking-wider border border-positive/40 text-positive hover:bg-positive/10"
								aria-label={t`Deposit`}
							>
								{t`Deposit`}
							</Button>
							<Button
								variant="text"
								size="none"
								onClick={() => openDepositModal("withdraw")}
								className="py-1.5 text-3xs uppercase tracking-wider border border-border/60 text-muted-fg hover:text-fg hover:border-fg/30 hover:bg-transparent"
								aria-label={t`Withdraw`}
							>
								{t`Withdraw`}
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
