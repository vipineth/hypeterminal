import { ClientOnly } from "@tanstack/react-router";
import { EllipsisVertical, Flame, LayoutGrid, Search } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useMarket } from "@/hooks/hyperliquid";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme";
import { StatBlock } from "./stat-block";
import { TokenSelector } from "./token-selector";
import { TradingViewChart } from "./trading-view-chart";

function formatPrice(price: string | undefined): string {
	if (!price) return "-";
	const num = Number.parseFloat(price);
	if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (num >= 1) return num.toFixed(2);
	return num.toFixed(4);
}

function formatVolume(vol: string | undefined): string {
	if (!vol) return "-";
	const num = Number.parseFloat(vol);
	if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
	if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
	if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
	return `$${num.toFixed(2)}`;
}

function formatFundingRate(rate: string | undefined): string {
	if (!rate) return "-";
	const num = Number.parseFloat(rate) * 100;
	return `${num >= 0 ? "+" : ""}${num.toFixed(4)}%`;
}

export function ChartPanel() {
	const { theme } = useTheme();
	const [selectedCoin, setSelectedCoin] = useState("BTC");
	const { data: market } = useMarket(selectedCoin);

	const fundingNum = market?.fundingRate ? Number.parseFloat(market.fundingRate) : 0;
	const isFundingPositive = fundingNum >= 0;

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<TokenSelector value={selectedCoin} onValueChange={setSelectedCoin} />
						<Separator orientation="vertical" className="mx-1 h-4" />
						<div className="hidden md:flex items-center gap-4 text-3xs">
							<StatBlock
								label="MARK"
								value={formatPrice(market?.markPrice)}
								valueClass="text-terminal-amber terminal-glow-amber"
							/>
							<StatBlock label="ORACLE" value={formatPrice(market?.indexPrice)} />
							<StatBlock label="VOL" value={formatVolume(market?.volume24h)} />
							<StatBlock label="OI" value={formatVolume(market?.openInterest)} />
							<div className="flex items-center gap-1">
								<Flame className={cn("size-3", isFundingPositive ? "text-terminal-green" : "text-terminal-red")} />
								<span
									className={cn(
										"text-muted-foreground tabular-nums",
										isFundingPositive ? "text-terminal-green" : "text-terminal-red",
									)}
								>
									{formatFundingRate(market?.fundingRate)}
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
