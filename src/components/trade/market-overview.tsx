import { t } from "@lingui/core/macro";
import clsx from "clsx";
import { Flame } from "lucide-react";
import { useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MARKET_KEY } from "@/config/interface";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { makePerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { calculateOpenInterestUSD } from "@/lib/market";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { StatBlock } from "./chart/stat-block";
import { TokenSelector } from "./chart/token-selector";

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

	const fundingNum = selectedMarket?.ctxNumbers?.funding ?? 0;
	const isFundingPositive = fundingNum >= 0;

	return (
		<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<TokenSelector value={selectedCoin} onValueChange={handleCoinChange} />

					<Separator orientation="vertical" className="mx-1 h-4" />
					<div className="hidden md:flex items-center gap-4 text-3xs">
						<StatBlock
							label={t`MARK`}
							value={formatUSD(selectedMarket?.ctxNumbers?.markPx ?? null)}
							valueClass="text-terminal-amber terminal-glow-amber"
						/>
						<StatBlock label={t`ORACLE`} value={formatUSD(selectedMarket?.ctxNumbers?.oraclePx ?? null)} />
						<StatBlock
							label={t`VOL`}
							value={formatUSD(selectedMarket?.ctxNumbers?.dayNtlVlm ?? null, {
								notation: "compact",
								compactDisplay: "short",
							})}
						/>
						<StatBlock
							label={t`OI`}
							value={formatUSD(calculateOpenInterestUSD(selectedMarket?.ctxNumbers), {
								notation: "compact",
								compactDisplay: "short",
							})}
						/>
						<div className="flex items-center gap-1">
							<Flame className={clsx("size-3", isFundingPositive ? "text-terminal-green" : "text-terminal-red")} />
							<span
								className={clsx(
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
