import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import { getOiUsd } from "@/domain/market";
import { formatClockDuration, formatPercent, formatPrice, formatUSD } from "@/lib/format";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { toBig } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { StatBlock } from "../chart/stat-block";

const HOUR_MS = 3_600_000;

interface Props {
	market: UnifiedMarketInfo | undefined;
}

export function MobileMarketStats({ market }: Props) {
	const isSpot = market?.kind === "spot";
	const fundingNum = toBig(market?.funding)?.toNumber() ?? 0;
	const fundingCountdown = useFundingCountdown();
	const compact = { notation: "compact", compactDisplay: "short" } as const;

	return (
		<div className="shrink-0 overflow-x-auto border-b border-stroke-weak/60 bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			<div className="flex w-max items-center divide-x divide-stroke-weak/40 px-1.5 py-2">
				<StatBlock label={t`Mark`} value={formatPrice(market?.markPx, { szDecimals: market?.szDecimals })} />
				{!isSpot && (
					<>
						<StatBlock label={t`Oracle`} value={formatPrice(market?.oraclePx, { szDecimals: market?.szDecimals })} />
						<StatBlock
							label={t`Funding / 1h`}
							value={`${formatPercent(fundingNum, { minimumFractionDigits: 4, signDisplay: "exceptZero" })} · ${fundingCountdown}`}
							valueClass={getValueColorClass(fundingNum)}
						/>
						<StatBlock label={t`Open Int`} value={formatUSD(getOiUsd(market?.openInterest, market?.markPx), compact)} />
					</>
				)}
				<StatBlock label={t`24h Vol`} value={formatUSD(market?.dayNtlVlm, compact)} />
			</div>
		</div>
	);
}

function useFundingCountdown() {
	const [remaining, setRemaining] = useState(() => HOUR_MS - (Date.now() % HOUR_MS));

	useEffect(() => {
		const id = setInterval(() => setRemaining(HOUR_MS - (Date.now() % HOUR_MS)), 1000);
		return () => clearInterval(id);
	}, []);

	return formatClockDuration(remaining);
}
