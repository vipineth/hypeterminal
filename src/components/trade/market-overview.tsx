import { t } from "@lingui/core/macro";
import { ExternalLink, Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD, shortenAddress } from "@/lib/format";
import { type UnifiedMarketInfo, useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getExplorerTokenUrl } from "@/lib/hyperliquid/explorer";
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

function getSpotTokenAddress(market: UnifiedMarketInfo | undefined): string | null {
	if (market?.kind !== "spot") return null;
	const baseToken = market.tokensInfo[0];
	if (!baseToken) return null;
	const tokenId = (baseToken as { tokenId?: string }).tokenId;
	if (!tokenId || !tokenId.startsWith("0x")) return null;
	return tokenId;
}

export function MarketOverview() {
	const { data: selectedMarketInfo } = useSelectedMarketInfo();

	const isSpot = selectedMarketInfo?.kind === "spot";
	const fundingNum = selectedMarketInfo?.funding ?? 0;
	const isFundingPositive = fundingNum >= 0;
	const change24h = calculate24hPriceChange(selectedMarketInfo?.prevDayPx, selectedMarketInfo?.markPx);
	const isChange24hPositive = (change24h ?? 0) >= 0;
	const spotTokenAddress = getSpotTokenAddress(selectedMarketInfo);

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
			{spotTokenAddress && (
				<a
					href={getExplorerTokenUrl(spotTokenAddress)}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1 text-muted-fg hover:text-fg transition-colors"
				>
					<span className="font-mono">{shortenAddress(spotTokenAddress, 4, 4)}</span>
					<ExternalLink className="size-3" />
				</a>
			)}
		</div>
	);
}
