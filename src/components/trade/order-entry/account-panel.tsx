import { ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { formatPercent, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

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

		const accountValue = parseNumber(summary.accountValue);
		const totalNtlPos = parseNumber(summary.totalNtlPos);
		const totalMarginUsed = parseNumber(summary.totalMarginUsed);
		const totalRawUsd = parseNumber(summary.totalRawUsd);

		// Calculate unrealized PNL from positions
		let unrealizedPnl = 0;
		for (const pos of clearinghouse.assetPositions ?? []) {
			unrealizedPnl += parseNumber(pos.position.unrealizedPnl);
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
					aria-label={isExpanded ? "Collapse account panel" : "Expand account panel"}
				>
					<div className="flex items-center gap-2">
						<span className="text-3xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
							Account
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
							<span className="text-4xs text-muted-foreground uppercase">Equity</span>
							<span
								className={cn(
									"text-sm font-semibold tabular-nums",
									hasData ? "text-terminal-green terminal-glow-green" : "text-muted-foreground",
								)}
							>
								{hasData ? formatUSD(accountMetrics.accountValue) : "-"}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">PNL</span>
							<span
								className={cn(
									"text-2xs font-medium tabular-nums",
									hasData
										? accountMetrics.unrealizedPnl >= 0
											? "text-terminal-green"
											: "text-terminal-red"
										: "text-muted-foreground",
								)}
							>
								{hasData ? formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" }) : "-"}
							</span>
						</div>
					</div>
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
				<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
					{[
						{ key: "perps", label: "Perps" },
						{ key: "spot", label: "Spot" },
					].map((tab) => (
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
							Connect wallet to view account
						</div>
					) : !hasData ? (
						<div className="text-3xs text-muted-foreground text-center py-4">Loading...</div>
					) : (
						<>
							<div className="border border-border/40 divide-y divide-border/40 text-3xs">
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Balance</span>
									<span className="tabular-nums">{formatUSD(accountMetrics.totalRawUsd)}</span>
								</div>
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Unrealized PNL</span>
									<span
										className={cn(
											"tabular-nums",
											accountMetrics.unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
										)}
									>
										{formatUSD(accountMetrics.unrealizedPnl, { signDisplay: "exceptZero" })}
									</span>
								</div>
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Available</span>
									<span className="tabular-nums">{formatUSD(accountMetrics.availableBalance)}</span>
								</div>
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Margin Used</span>
									<span className="tabular-nums">{formatUSD(accountMetrics.totalMarginUsed)}</span>
								</div>
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Margin Ratio</span>
									<span className="tabular-nums">
										{formatPercent(accountMetrics.marginRatio, { maximumFractionDigits: 1 })}
									</span>
								</div>
								<div className="flex items-center justify-between px-2 py-1.5">
									<span className="text-muted-foreground">Cross Leverage</span>
									<span className="tabular-nums text-terminal-cyan">
										{accountMetrics.crossLeverage.toFixed(2)}x
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-1">
								<button
									type="button"
									className="py-1.5 text-3xs uppercase tracking-wider border border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 transition-colors"
									tabIndex={0}
									aria-label="Deposit"
								>
									Deposit
								</button>
								<button
									type="button"
									className="py-1.5 text-3xs uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
									tabIndex={0}
									aria-label="Withdraw"
								>
									Withdraw
								</button>
							</div>
						</>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
