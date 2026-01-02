import { Flame } from "lucide-react";
import { useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MARKET_KEY, UI_TEXT } from "@/constants/app";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { formatPercent, formatUSD } from "@/lib/format";
import { makePerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { calculateOpenInterestUSD } from "@/lib/market";
import { cn } from "@/lib/utils";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { StatBlock } from "./chart/stat-block";
import { TokenSelector } from "./chart/token-selector";

const MARKET_OVERVIEW_TEXT = UI_TEXT.MARKET_OVERVIEW;

export function MarketOverview() {
	const { data: selectedMarket } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const selectedCoin = selectedMarket?.coin ?? perpCoinFromMarketKey(DEFAULT_MARKET_KEY);
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
		<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<TokenSelector value={selectedCoin} onValueChange={handleCoinChange} />

					<Separator orientation="vertical" className="mx-1 h-4" />
					<div className="hidden md:flex items-center gap-4 text-3xs">
						<StatBlock
							label={MARKET_OVERVIEW_TEXT.LABEL_MARK}
							value={formatUSD(selectedMarket?.ctx?.markPx ? Number(selectedMarket.ctx.markPx) : null)}
							valueClass="text-terminal-amber terminal-glow-amber"
						/>
						<StatBlock
							label={MARKET_OVERVIEW_TEXT.LABEL_ORACLE}
							value={formatUSD(selectedMarket?.ctx?.oraclePx ? Number(selectedMarket.ctx.oraclePx) : null)}
						/>
						<StatBlock
							label={MARKET_OVERVIEW_TEXT.LABEL_VOLUME}
							value={formatUSD(selectedMarket?.ctx?.dayNtlVlm ? Number(selectedMarket.ctx.dayNtlVlm) : null, {
								notation: "compact",
								compactDisplay: "short",
							})}
						/>
						<StatBlock
							label={MARKET_OVERVIEW_TEXT.LABEL_OPEN_INTEREST}
							value={formatUSD(calculateOpenInterestUSD(selectedMarket?.ctx), {
								notation: "compact",
								compactDisplay: "short",
							})}
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
			</div>
		</div>
	);
}
