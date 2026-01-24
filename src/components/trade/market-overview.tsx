import { t } from "@lingui/core/macro";
import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { type UnifiedMarketInfo, useSelectedMarketInfo } from "@/lib/hyperliquid";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";
import { Badge } from "../ui/badge";
import { StatBlock } from "./chart/stat-block";

function getLabelForMarketKind(market: UnifiedMarketInfo | undefined): string {
	if (!market) return "";
	if (market.kind === "spot") return "Spot";
	if (market.kind === "perp") return "Perp";
	if (market.kind === "builderPerp") return `Perp: ${market.dex}`;
	return "";
}

export function MarketOverview() {
	const { data: selectedMarketInfo } = useSelectedMarketInfo();

	const isSpot = selectedMarketInfo?.kind === "spot";
	const fundingNum = selectedMarketInfo?.funding ?? 0;
	const isFundingPositive = fundingNum >= 0;
	const change24h = calculate24hPriceChange(selectedMarketInfo?.prevDayPx, selectedMarketInfo?.markPx);
	const isChange24hPositive = (change24h ?? 0) >= 0;

	return (
		<div className="hidden md:flex items-center gap-4 text-3xs">
			<Badge className="uppercase text-4xs" variant="neutral">
				{getLabelForMarketKind(selectedMarketInfo)}
			</Badge>
			<StatBlock
				label={isSpot ? t`PRICE` : t`MARK`}
				value={formatUSD(selectedMarketInfo?.markPx)}
				valueClass="text-warning"
			/>
			<StatBlock
				label={t`24H`}
				value={change24h !== null ? formatPercent(change24h / 100, { signDisplay: "exceptZero" }) : "—"}
				valueClass={isChange24hPositive ? "text-positive" : "text-negative"}
			/>
			{!isSpot && (
				<>
					<StatBlock label={t`ORACLE`} value={formatUSD(selectedMarketInfo?.oraclePx)} />
					<StatBlock
						label={t`OI`}
						value={formatUSD(calculateOpenInterestUSD(selectedMarketInfo?.openInterest, selectedMarketInfo?.markPx), {
							notation: "compact",
							compactDisplay: "short",
						})}
					/>
					<div className="flex items-center gap-1">
						<Flame className={cn("size-3", isFundingPositive ? "text-positive" : "text-negative")} />
						<span className={cn("text-muted-fg tabular-nums", isFundingPositive ? "text-positive" : "text-negative")}>
							{formatPercent(fundingNum, {
								minimumFractionDigits: 4,
								signDisplay: "exceptZero",
							})}
						</span>
					</div>
				</>
			)}
			<StatBlock
				label={t`VOL`}
				value={formatUSD(selectedMarketInfo?.dayNtlVlm, {
					notation: "compact",
					compactDisplay: "short",
				})}
			/>
		</div>
	);
}
