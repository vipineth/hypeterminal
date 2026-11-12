import { Tooltip } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, FireIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { get24hChange, getOiUsd } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatClockDuration, formatPercent, formatUSD, shortenAddress } from "@/lib/format";
import {
	getExplorerTokenUrl,
	type SpotMarketInfo,
	type UnifiedMarketInfo,
	useSelectedMarketInfo,
	useSubscription,
} from "@/lib/hyperliquid";
import { toBig } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { StatBlock } from "./chart/stat-block";

const HOUR_MS = 3_600_000;

function FundingTooltipContent({ fundingNum }: { fundingNum: number }) {
	const [remaining, setRemaining] = useState(() => HOUR_MS - (Date.now() % HOUR_MS));

	useEffect(() => {
		const id = setInterval(() => setRemaining(HOUR_MS - (Date.now() % HOUR_MS)), 1000);
		return () => clearInterval(id);
	}, []);

	const rows = [
		{ label: t`7 days`, rate: fundingNum * 24 * 7 },
		{ label: t`30 days`, rate: fundingNum * 24 * 30 },
		{ label: t`1 year`, rate: fundingNum * 24 * 365 },
	];

	return (
		<div className="min-w-[9rem] space-y-2">
			<div className="flex items-center justify-between gap-4">
				<span className="text-2xs uppercase tracking-wide text-fg-muted">{t`Resets in`}</span>
				<span className="font-mono text-xs tabular-nums text-fg">{formatClockDuration(remaining)}</span>
			</div>
			<div className="border-t border-stroke-weak pt-2 space-y-1.5">
				{rows.map(({ label, rate }) => (
					<div key={label} className="flex items-center justify-between gap-4">
						<span className="text-2xs text-fg-muted">{label}</span>
						<span className={cn("text-xs font-medium tabular-nums", getValueColorClass(rate))}>
							{formatPercent(rate, { signDisplay: "exceptZero" })}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function StatDivider() {
	return <div className="h-3 w-px shrink-0 self-center bg-stroke-weak/30" aria-hidden />;
}

function getSpotTokenAddress(market: UnifiedMarketInfo | undefined): string | null {
	if (market?.kind !== "spot") return null;
	const baseToken = market.tokensInfo[0];
	if (!baseToken) return null;
	const tokenId = (baseToken as { tokenId?: string }).tokenId;
	if (!tokenId?.startsWith("0x")) return null;
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

	const { data: perpCtxEvent } = useSubscription(
		"activeAssetCtx",
		{ coin: perpCoin },
		{ enabled: !!perpCoin && !isSpot },
	);
	const { data: spotCtxEvent } = useSubscription(
		"activeSpotAssetCtx",
		{ coin: spotCoin },
		{ enabled: !!spotCoin && isSpot },
	);

	const liveCtx = isSpot ? spotCtxEvent?.ctx : perpCtxEvent?.ctx;
	const perpCtx = perpCtxEvent?.ctx;

	const markPxLive = liveCtx?.markPx;
	const dayNtlVlm = liveCtx?.dayNtlVlm;
	const oraclePx = perpCtx?.oraclePx;
	const funding = perpCtx?.funding;

	const markPxForDisplay = markPxLive ?? selectedMarketInfo?.markPx;
	const prevDayForChange = liveCtx?.prevDayPx ?? selectedMarketInfo?.prevDayPx;
	const markForChange = markPxLive ?? selectedMarketInfo?.markPx;

	const fundingNum = toBig(funding)?.toNumber() ?? 0;
	const change24h = get24hChange(prevDayForChange, markForChange);
	const oiUsd = getOiUsd(perpCtx?.openInterest, perpCtx?.markPx);
	const spotTokenAddress = getSpotTokenAddress(selectedMarketInfo);

	const heroPrice = markPxForDisplay != null ? formatUSD(markPxForDisplay, { compact: false }) : "—";
	const changePct = change24h !== null ? formatPercent(change24h / 100, { signDisplay: "exceptZero" }) : "—";

	return (
		<div className="flex min-h-0 w-max min-w-0 flex-nowrap items-center gap-0 text-xs">
			<div className="flex shrink-0 items-center gap-2 border-r border-stroke-weak/35 pr-2.5">
				<span className="font-sans text-sm font-semibold tabular-nums tracking-tight text-fg">{heroPrice}</span>
				<div className="flex min-w-0 items-baseline gap-1">
					<span className="shrink-0 text-2xs font-medium uppercase tracking-wide text-fg-muted">{t`24h`}</span>
					<span
						className={cn(
							"min-w-0 font-sans text-xs font-medium tabular-nums leading-none",
							change24h === null ? "text-fg-muted" : getValueColorClass(change24h),
						)}
					>
						{changePct}
					</span>
				</div>
			</div>

			{!isSpot && (
				<>
					<StatDivider />
					<StatBlock layout="inline" label={t`ORACLE`} value={formatUSD(oraclePx)} />
					<StatDivider />
					<StatBlock
						layout="inline"
						label={t`24H VOL`}
						value={formatUSD(dayNtlVlm, {
							notation: "compact",
							compactDisplay: "short",
						})}
					/>
					<StatDivider />
					<StatBlock
						layout="inline"
						label={t`OPEN INT`}
						value={formatUSD(oiUsd, {
							notation: "compact",
							compactDisplay: "short",
						})}
					/>
					<StatDivider />
					<Tooltip content={<FundingTooltipContent fundingNum={fundingNum} />} side="bottom">
						<span>
							<StatBlock
								layout="inline"
								label={t`FUNDING`}
								value={formatPercent(fundingNum, {
									minimumFractionDigits: 4,
									signDisplay: "exceptZero",
								})}
								valueClass={cn(
									"underline decoration-dashed underline-offset-2 cursor-pointer",
									getValueColorClass(fundingNum),
								)}
								icon={<FireIcon className={cn("size-2.5 shrink-0", getValueColorClass(fundingNum))} />}
							/>
						</span>
					</Tooltip>
				</>
			)}
			{isSpot && (
				<>
					<StatDivider />
					<StatBlock
						layout="inline"
						label={t`24H VOL`}
						value={formatUSD(dayNtlVlm, {
							notation: "compact",
							compactDisplay: "short",
						})}
					/>
				</>
			)}
			{spotTokenAddress && (
				<>
					<StatDivider />
					<div className="flex items-center gap-1.5 whitespace-nowrap px-1.5 py-px">
						<span className="text-2xs text-fg-muted/80 uppercase tracking-wide">{t`TOKEN`}</span>
						<a
							href={getExplorerTokenUrl(spotTokenAddress)}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-0.5 font-sans text-xs font-medium tabular-nums text-fg hover:text-brand transition-colors"
						>
							{shortenAddress(spotTokenAddress, 4, 4)}
							<ArrowSquareOutIcon className="size-2.5 shrink-0 text-icon" aria-hidden="true" />
						</a>
					</div>
				</>
			)}
		</div>
	);
}
