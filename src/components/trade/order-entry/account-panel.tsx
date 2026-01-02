import { ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { formatPercent, formatUSD } from "@/lib/format";
import { parseNumberOrZero } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;
const ACCOUNT_TABS = [
	{ key: "perps", label: ACCOUNT_TEXT.TAB_PERPS },
	{ key: "spot", label: ACCOUNT_TEXT.TAB_SPOT },
] as const;

export function AccountPanel() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");

	const { address, isConnected } = useConnection();
	const { data: clearinghouse } = useClearinghouseState({
		user: address,
		enabled: isConnected,
	});

	// Calculate account metrics from clearinghouse data
	const accountMetrics = useMemo(() => {
		if (!clearinghouse?.crossMarginSummary) {
			return null;
		}

		const summary = clearinghouse.crossMarginSummary;

		const accountValue = parseNumberOrZero(summary.accountValue);
		const totalNtlPos = parseNumberOrZero(summary.totalNtlPos);
		const totalMarginUsed = parseNumberOrZero(summary.totalMarginUsed);
		const totalRawUsd = parseNumberOrZero(summary.totalRawUsd);

		// Calculate unrealized PNL from positions
		let unrealizedPnl = 0;
		for (const pos of clearinghouse.assetPositions ?? []) {
			unrealizedPnl += parseNumberOrZero(pos.position.unrealizedPnl);
		}

		// Margin ratio = totalMarginUsed / accountValue (as percentage)
		const marginRatio = accountValue > 0 ? totalMarginUsed / accountValue : 0;

		// Maintenance margin (approximate - usually ~50% of initial margin for cross)
		const maintMargin = totalMarginUsed * 0.5;

		// Cross leverage = totalNtlPos / accountValue
		const crossLeverage = accountValue > 0 ? Math.abs(totalNtlPos) / accountValue : 0;

		// Available balance for trading
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
	const headerPnl = hasData ? formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" }) : FALLBACK_VALUE_PLACEHOLDER;
	const headerPnlClass = hasData
		? accountMetrics.unrealizedPnl >= 0
			? "text-terminal-green"
			: "text-terminal-red"
		: "text-muted-foreground";

	const summaryRows = useMemo(() => {
		if (!accountMetrics) return [];
		return [
			{
				label: ACCOUNT_TEXT.BALANCE_LABEL,
				value: formatUSD(accountMetrics.totalRawUsd),
				valueClass: "tabular-nums",
			},
			{
				label: ACCOUNT_TEXT.UNREALIZED_LABEL,
				value: formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
				valueClass: cn(
					"tabular-nums",
					accountMetrics.unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
				),
			},
			{
				label: ACCOUNT_TEXT.AVAILABLE_LABEL,
				value: formatUSD(accountMetrics.availableBalance),
				valueClass: "tabular-nums",
			},
			{
				label: ACCOUNT_TEXT.MARGIN_USED_LABEL,
				value: formatUSD(accountMetrics.totalMarginUsed),
				valueClass: "tabular-nums",
			},
			{
				label: ACCOUNT_TEXT.MARGIN_RATIO_LABEL,
				value: formatPercent(accountMetrics.marginRatio, { maximumFractionDigits: 1 }),
				valueClass: "tabular-nums",
			},
			{
				label: ACCOUNT_TEXT.CROSS_LEVERAGE_LABEL,
				value: `${accountMetrics.crossLeverage.toFixed(2)}x`,
				valueClass: "tabular-nums text-terminal-cyan",
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
				<button
					type="button"
					className="w-full px-2 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer group border-b border-border/40"
					tabIndex={0}
					aria-label={isExpanded ? ACCOUNT_TEXT.ARIA_COLLAPSE : ACCOUNT_TEXT.ARIA_EXPAND}
				>
					<div className="flex items-center gap-2">
						<span className="text-3xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
							{ACCOUNT_TEXT.TITLE}
						</span>
						<ChevronUp
							className={cn(
								"size-3 text-muted-foreground transition-transform duration-200",
								!isExpanded && "rotate-180",
							)}
						/>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">{ACCOUNT_TEXT.EQUITY_LABEL}</span>
							<span
								className={cn(
									"text-sm font-semibold tabular-nums",
									hasData ? "text-terminal-green terminal-glow-green" : "text-muted-foreground",
								)}
							>
								{headerEquity}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">{ACCOUNT_TEXT.PNL_LABEL}</span>
							<span
								className={cn("text-2xs font-medium tabular-nums", headerPnlClass)}
							>
								{headerPnl}
							</span>
						</div>
					</div>
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
				<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
					{ACCOUNT_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setActiveTab(tab.key as "perps" | "spot");
							}}
							className={cn(
								"px-2 py-1 text-4xs uppercase tracking-wider transition-colors",
								activeTab === tab.key
									? "text-terminal-cyan border-b border-terminal-cyan"
									: "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
							aria-label={tab.label}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="p-2 space-y-2 max-h-48 overflow-y-auto">
					{!isConnected ? (
						<div className="text-3xs text-muted-foreground text-center py-4">
							{ACCOUNT_TEXT.CONNECT}
						</div>
					) : !hasData ? (
						<div className="text-3xs text-muted-foreground text-center py-4">{ACCOUNT_TEXT.LOADING}</div>
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
								<button
									type="button"
									className="py-1.5 text-3xs uppercase tracking-wider border border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 transition-colors"
									tabIndex={0}
									aria-label={ACCOUNT_TEXT.DEPOSIT_LABEL}
								>
									{ACCOUNT_TEXT.DEPOSIT_LABEL}
								</button>
								<button
									type="button"
									className="py-1.5 text-3xs uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
									tabIndex={0}
									aria-label={ACCOUNT_TEXT.WITHDRAW_LABEL}
								>
									{ACCOUNT_TEXT.WITHDRAW_LABEL}
								</button>
							</div>
						</>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
