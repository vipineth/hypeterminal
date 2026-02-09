import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, FireIcon } from "@phosphor-icons/react";
import { get24hChange, getOiUsd } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD, shortenAddress } from "@/lib/format";
import { type SpotMarketInfo, type UnifiedMarketInfo, useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getExplorerTokenUrl } from "@/lib/hyperliquid/explorer";
import { useSubActiveAssetCtx } from "@/lib/hyperliquid/hooks/subscription/useSubActiveAssetCtx";
import { useSubActiveSpotAssetCtx } from "@/lib/hyperliquid/hooks/subscription/useSubActiveSpotAssetCtx";
import { getValueColorClass, toBig } from "@/lib/trade/numbers";
import { Badge } from "../ui/badge";
import { StatBlock } from "./chart/stat-block";

function getLabelForMarketKind(market: UnifiedMarketInfo | undefined): string {
	if (!market) return "";
	if (market.kind === "spot") return "Spot";
	if (market.kind === "builderPerp") return `${market.dex}`;
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

function getSpotSubscriptionCoin(market: UnifiedMarketInfo | undefined): string {
	if (market?.kind !== "spot") return "";
	return `@${(market as SpotMarketInfo).index}`;
}

export function MarketOverview() {
	const { data: selectedMarketInfo } = useSelectedMarketInfo();

	const isSpot = selectedMarketInfo?.kind === "spot";
	const perpCoin = selectedMarketInfo?.name ?? "";
	const spotCoin = getSpotSubscriptionCoin(selectedMarketInfo);

	const { data: perpCtxEvent } = useSubActiveAssetCtx({ coin: perpCoin }, { enabled: !!perpCoin && !isSpot });
	const { data: spotCtxEvent } = useSubActiveSpotAssetCtx({ coin: spotCoin }, { enabled: !!spotCoin && isSpot });

	const liveCtx = isSpot ? spotCtxEvent?.ctx : perpCtxEvent?.ctx;
	const perpCtx = perpCtxEvent?.ctx;

	const markPx = liveCtx?.markPx;
	const dayNtlVlm = liveCtx?.dayNtlVlm;
	const oraclePx = perpCtx?.oraclePx;
	const funding = perpCtx?.funding;

	const fundingNum = toBig(funding)?.toNumber() ?? 0;
	const change24h = get24hChange(liveCtx?.prevDayPx, liveCtx?.markPx);
	const oiUsd = getOiUsd(perpCtx?.openInterest, perpCtx?.markPx);
	const spotTokenAddress = getSpotTokenAddress(selectedMarketInfo);

	return (
		<div className="hidden md:flex items-center gap-4 text-3xs">
			{getLabelForMarketKind(selectedMarketInfo) ? (
				<Badge className="uppercase text-4xs" variant="neutral">
					{getLabelForMarketKind(selectedMarketInfo)}
				</Badge>
			) : null}
			<StatBlock
				label={isSpot ? t`PRICE` : t`MARK`}
				value={formatUSD(markPx, { compact: false })}
				valueClass={getValueColorClass(change24h)}
			/>
			<StatBlock
				label={t`24H`}
				value={change24h !== null ? formatPercent(change24h / 100, { signDisplay: "exceptZero" }) : "—"}
				valueClass={getValueColorClass(change24h)}
			/>
			{!isSpot && (
				<>
					<StatBlock label={t`ORACLE`} value={formatUSD(oraclePx)} />
					<StatBlock
						label={t`OI`}
						value={formatUSD(oiUsd, {
							notation: "compact",
							compactDisplay: "short",
						})}
					/>
					<div className="flex items-center gap-1">
						<FireIcon className={cn("size-3", getValueColorClass(fundingNum))} />
						<span className={cn("tabular-nums", getValueColorClass(fundingNum))}>
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
				value={formatUSD(dayNtlVlm, {
					notation: "compact",
					compactDisplay: "short",
				})}
			/>
			{spotTokenAddress && (
				<a
					href={getExplorerTokenUrl(spotTokenAddress)}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1 text-text-950 hover:text-text-950 transition-colors"
				>
					<span className="font-mono">{shortenAddress(spotTokenAddress, 4, 4)}</span>
					<ArrowSquareOutIcon className="size-3" />
				</a>
			)}
		</div>
	);
}
