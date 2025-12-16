import { ClientOnly } from "@tanstack/react-router";
import { EllipsisVertical, Flame, LayoutGrid, Search } from "lucide-react";
import { useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid";
import { makePerpMarketKey } from "@/lib/hyperliquid";
import { formatPercent, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { StatBlock } from "./stat-block";
import { TokenSelector } from "./token-selector";
import { TradingViewChart } from "./trading-view-chart";

export function ChartPanel() {
	const { theme } = useTheme();
	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const selectedCoin = selectedMarket?.coin ?? "BTC";
	const { setSelectedMarketKey } = useMarketPrefsActions();

	const handleCoinChange = useCallback(
		(coin: string) => {
			setSelectedMarketKey(makePerpMarketKey(coin));
		},
		[setSelectedMarketKey],
	);

	const fundingNum = selectedMarket?.ctx?.funding ? Number.parseFloat(selectedMarket.ctx.funding) : 0;
	const isFundingPositive = fundingNum >= 0;

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<TokenSelector value={selectedCoin} onValueChange={handleCoinChange} />

						<Separator orientation="vertical" className="mx-1 h-4" />
						<div className="hidden md:flex items-center gap-4 text-3xs">
							<StatBlock
								label="MARK"
								value={selectedMarket?.ctx?.markPx ? formatUSD(Number(selectedMarket.ctx.markPx)) : "-"}
								valueClass="text-terminal-amber terminal-glow-amber"
							/>
							<StatBlock
								label="ORACLE"
								value={selectedMarket?.ctx?.oraclePx ? formatUSD(Number(selectedMarket.ctx.oraclePx)) : "-"}
							/>
							<StatBlock
								label="VOL"
								value={
									selectedMarket?.ctx?.dayNtlVlm
										? formatUSD(Number(selectedMarket.ctx.dayNtlVlm), { notation: "compact", compactDisplay: "short" })
										: "-"
								}
							/>
							<StatBlock
								label="OI"
								value={
									selectedMarket?.ctx?.openInterest
										? formatUSD(Number(selectedMarket.ctx.openInterest), { notation: "compact", compactDisplay: "short" })
										: "-"
								}
							/>
							<div className="flex items-center gap-1">
								<Flame className={cn("size-3", isFundingPositive ? "text-terminal-green" : "text-terminal-red")} />
								<span
									className={cn(
										"text-muted-foreground tabular-nums",
										isFundingPositive ? "text-terminal-green" : "text-terminal-red",
									)}
								>
									{formatPercent(fundingNum, {
										minimumFractionDigits: 4,
										signDisplay: "exceptZero",
									})}
								</span>
							</div>
						</div>
					</div>
					<div className="hidden md:flex items-center gap-0.5">
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="Search"
						>
							<Search className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="Layout"
						>
							<LayoutGrid className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="More"
						>
							<EllipsisVertical className="size-3.5" />
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<ClientOnly>
					<TradingViewChart symbol={`${selectedCoin}/USDC`} theme={theme === "dark" ? "dark" : "light"} />
				</ClientOnly>
			</div>
		</div>
	);
}
