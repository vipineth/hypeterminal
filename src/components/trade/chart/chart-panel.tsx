import { ClientOnly } from "@tanstack/react-router";
import { EllipsisVertical, Flame, LayoutGrid, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMarket } from "@/hooks/hyperliquid";
import { formatPercent, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme";
import { useSelectedMarket, useSelectedMarketActions } from "@/stores";
import { StatBlock } from "./stat-block";
import { TokenSelector } from "./token-selector";
import { TradingViewChart } from "./trading-view-chart";

export function ChartPanel() {
	const { theme } = useTheme();
	const selectedCoin = useSelectedMarket();
	const { setCoin } = useSelectedMarketActions();
	const { data: market } = useMarket(selectedCoin);

	const fundingNum = market?.fundingRate ? Number.parseFloat(market.fundingRate) : 0;
	const isFundingPositive = fundingNum >= 0;

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<TokenSelector value={selectedCoin} onValueChange={setCoin} />
						<Separator orientation="vertical" className="mx-1 h-4" />
						<div className="hidden md:flex items-center gap-4 text-3xs">
							<StatBlock
								label="MARK"
								value={market?.markPrice ? formatUSD(Number(market.markPrice)) : "-"}
								valueClass="text-terminal-amber terminal-glow-amber"
							/>
							<StatBlock label="ORACLE" value={market?.indexPrice ? formatUSD(Number(market.indexPrice)) : "-"} />
							<StatBlock
								label="VOL"
								value={
									market?.volume24h
										? formatUSD(Number(market.volume24h), { notation: "compact", compactDisplay: "short" })
										: "-"
								}
							/>
							<StatBlock
								label="OI"
								value={
									market?.openInterest
										? formatUSD(Number(market.openInterest), { notation: "compact", compactDisplay: "short" })
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
