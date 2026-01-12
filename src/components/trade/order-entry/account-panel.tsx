import { t } from "@lingui/core/macro";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useSubClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumberOrZero } from "@/lib/trade/numbers";

type SummaryRow = {
	label: string;
	value: string;
	valueClass: string;
};

export function AccountPanel() {
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");

	const { address, isConnected } = useConnection();
	const { data: stateEvent } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const clearinghouse = stateEvent?.clearinghouseState;

	const { data: spotEvent } = useSubSpotState({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const spotData = spotEvent?.spotState;

	const perpMetrics = useMemo(() => {
		if (!clearinghouse?.crossMarginSummary) {
			return null;
		}

		const summary = clearinghouse.crossMarginSummary;

		const accountValue = parseNumberOrZero(summary.accountValue);
		const totalNtlPos = parseNumberOrZero(summary.totalNtlPos);
		const totalMarginUsed = parseNumberOrZero(summary.totalMarginUsed);
		const totalRawUsd = parseNumberOrZero(summary.totalRawUsd);

		let unrealizedPnl = 0;
		for (const pos of clearinghouse.assetPositions ?? []) {
			unrealizedPnl += parseNumberOrZero(pos.position.unrealizedPnl);
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
	}, [clearinghouse]);

	const spotMetrics = useMemo(() => {
		if (!spotData?.balances) {
			return null;
		}

		let totalValue = 0;
		let availableValue = 0;
		let inOrderValue = 0;
		const tokens: Array<{ coin: string; total: number; available: number; usdValue: number }> = [];

		for (const b of spotData.balances) {
			const total = parseNumberOrZero(b.total);
			const hold = parseNumberOrZero(b.hold);
			const entryNtl = parseNumberOrZero(b.entryNtl);

			if (total === 0) continue;

			const available = Math.max(0, total - hold);
			const usdValue = b.coin === "USDC" ? total : entryNtl;

			totalValue += usdValue;
			availableValue += b.coin === "USDC" ? available : (available / total) * usdValue;
			inOrderValue += b.coin === "USDC" ? hold : (hold / total) * usdValue;

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
	}, [spotData]);

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
		activeTab === "perps" && hasPerpData
			? perpMetrics.unrealizedPnl >= 0
				? "text-terminal-green"
				: "text-terminal-red"
			: "text-muted-foreground";

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
				valueClass: cn("tabular-nums", perpMetrics.unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red"),
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
				valueClass: "tabular-nums text-terminal-amber",
			},
			{
				label: t`Assets`,
				value: `${spotMetrics.tokenCount}`,
				valueClass: "tabular-nums",
			},
			...spotMetrics.topTokens.map((token) => ({
				label: token.coin,
				value: formatToken(token.total, token.coin === "USDC" ? 2 : 4),
				valueClass: "tabular-nums",
			})),
		];
	}, [spotMetrics]);

	const summaryRows = activeTab === "perps" ? perpRows : spotRows;
	const hasData = activeTab === "perps" ? hasPerpData : hasSpotData;

	return (
		<div className="shrink-0 flex flex-col relative bg-linear-to-b from-surface to-background border-t border-terminal-cyan/20">
			<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-terminal-cyan/40 to-transparent" />
			<div className="px-2 py-2 border-b border-border/40 flex items-center justify-between backdrop-blur-sm">
				<span className="text-3xs uppercase tracking-wider text-terminal-cyan/70">{t`Account`}</span>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<span className="text-4xs text-muted-foreground uppercase">{t`Equity`}</span>
						<span
							className={cn(
								"text-sm font-semibold tabular-nums",
								hasData ? "text-terminal-green terminal-glow-green" : "text-muted-foreground",
							)}
						>
							{headerEquity}
						</span>
					</div>
					{activeTab === "perps" && (
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">{t`PNL`}</span>
							<span className={cn("text-2xs font-medium tabular-nums", headerPnlClass)}>{headerPnl}</span>
						</div>
					)}
				</div>
			</div>

			<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
				<Button
					variant="ghost"
					size="none"
					onClick={() => setActiveTab("perps")}
					className={cn(
						"px-2 py-1 text-4xs uppercase tracking-wider hover:bg-transparent",
						activeTab === "perps"
							? "text-foreground border-b border-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
					aria-label={t`Perps`}
				>
					{t`Perps`}
				</Button>
				<Button
					variant="ghost"
					size="none"
					onClick={() => setActiveTab("spot")}
					className={cn(
						"px-2 py-1 text-4xs uppercase tracking-wider hover:bg-transparent",
						activeTab === "spot"
							? "text-foreground border-b border-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
					aria-label={t`Spot`}
				>
					{t`Spot`}
				</Button>
			</div>

			<div className="p-2 space-y-2 overflow-y-auto">
				{!isConnected ? (
					<div className="text-3xs text-muted-foreground text-center py-4">{t`Connect wallet to view account`}</div>
				) : !hasData ? (
					<div className="text-3xs text-muted-foreground text-center py-4">{t`Loading...`}</div>
				) : (
					<>
						<div className="border border-terminal-cyan/10 bg-background divide-y divide-border/30 text-3xs">
							{summaryRows.map((row) => (
								<div key={row.label} className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">{row.label}</span>
									<span className={row.valueClass}>{row.value}</span>
								</div>
							))}
						</div>

						<div className="grid grid-cols-2 gap-1">
							<Button
								variant="ghost"
								size="none"
								className="py-1.5 text-3xs uppercase tracking-wider border border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10"
								aria-label={t`Deposit`}
							>
								{t`Deposit`}
							</Button>
							<Button
								variant="ghost"
								size="none"
								className="py-1.5 text-3xs uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-transparent"
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
