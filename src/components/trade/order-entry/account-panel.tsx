import { t } from "@lingui/core/macro";
import { ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumberOrZero } from "@/lib/trade/numbers";
import clsx from "clsx";

export function AccountPanel() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");

	const { address, isConnected } = useConnection();
	const { data: stateEvent } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const clearinghouse = stateEvent?.clearinghouseState;

	const accountMetrics = useMemo(() => {
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

		const maintMargin = totalMarginUsed * 0.5;

		const crossLeverage = accountValue > 0 ? Math.abs(totalNtlPos) / accountValue : 0;

		const availableBalance = Math.max(0, accountValue - totalMarginUsed);

		return {
			accountValue,
			totalRawUsd,
			unrealizedPnl,
			marginRatio,
			maintMargin,
			crossLeverage,
			availableBalance,
			totalMarginUsed,
		};
	}, [clearinghouse]);

	const hasData = isConnected && accountMetrics !== null;
	const headerEquity = hasData ? formatUSD(accountMetrics.accountValue) : FALLBACK_VALUE_PLACEHOLDER;
	const headerPnl = hasData
		? formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" })
		: FALLBACK_VALUE_PLACEHOLDER;
	const headerPnlClass = hasData
		? accountMetrics.unrealizedPnl >= 0
			? "text-terminal-green"
			: "text-terminal-red"
		: "text-muted-foreground";

	const summaryRows = useMemo(() => {
		if (!accountMetrics) return [];
		return [
			{
				label: t`Balance`,
				value: formatUSD(accountMetrics.totalRawUsd),
				valueClass: "tabular-nums",
			},
			{
				label: t`Unrealized PNL`,
				value: formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
				valueClass: clsx("tabular-nums", accountMetrics.unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red"),
			},
			{
				label: t`Available`,
				value: formatUSD(accountMetrics.availableBalance),
				valueClass: "tabular-nums",
			},
			{
				label: t`Margin Used`,
				value: formatUSD(accountMetrics.totalMarginUsed),
				valueClass: "tabular-nums",
			},
			{
				label: t`Margin Ratio`,
				value: formatPercent(accountMetrics.marginRatio, { maximumFractionDigits: 1 }),
				valueClass: "tabular-nums",
			},
			{
				label: t`Cross Leverage`,
				value: `${accountMetrics.crossLeverage.toFixed(2)}x`,
				valueClass: "tabular-nums font-medium",
			},
		];
	}, [accountMetrics]);

	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={setIsExpanded}
			className="shrink-0 flex flex-col bg-surface/30 border-t border-border/40"
		>
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="none"
					className="w-full px-2 py-2 justify-between hover:bg-accent/30 group border-b border-border/40 rounded-none"
					aria-label={isExpanded ? t`Collapse account panel` : t`Expand account panel`}
				>
					<div className="flex items-center gap-2">
						<span className="text-3xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
							{t`Account`}
						</span>
						<ChevronUp
							className={clsx(
								"size-3 text-muted-foreground transition-transform duration-200",
								!isExpanded && "rotate-180",
							)}
						/>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">{t`Equity`}</span>
							<span
								className={clsx(
									"text-sm font-semibold tabular-nums",
									hasData ? "text-terminal-green terminal-glow-green" : "text-muted-foreground",
								)}
							>
								{headerEquity}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">{t`PNL`}</span>
							<span className={clsx("text-2xs font-medium tabular-nums", headerPnlClass)}>{headerPnl}</span>
						</div>
					</div>
				</Button>
			</CollapsibleTrigger>

			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
				<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
					<Button
						variant="ghost"
						size="none"
						onClick={(e) => {
							e.stopPropagation();
							setActiveTab("perps");
						}}
						className={clsx(
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
						onClick={(e) => {
							e.stopPropagation();
							setActiveTab("spot");
						}}
						className={clsx(
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

				<div className="p-2 space-y-2 max-h-48 overflow-y-auto">
					{!isConnected ? (
						<div className="text-3xs text-muted-foreground text-center py-4">{t`Connect wallet to view account`}</div>
					) : !hasData ? (
						<div className="text-3xs text-muted-foreground text-center py-4">{t`Loading...`}</div>
					) : (
						<>
							<div className="border border-border/40 divide-y divide-border/40 text-3xs">
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
			</CollapsibleContent>
		</Collapsible>
	);
}
