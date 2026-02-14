import { FireIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { get24hChange, getOiUsd } from "@/domain/market";
import { createChartName } from "@/lib/chart/candle";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass, toBig } from "@/lib/trade/numbers";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useTheme } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { TokenSelector } from "../chart/token-selector";
import { TradingViewChart } from "../chart/tradingview-chart";

const MOBILE_CHART_DISABLED_FEATURES = ["left_toolbar", "drawing_templates"];

interface Props {
	className?: string;
}

export function MobileMainScreen({ className }: Props) {
	const { data: market, isLoading } = useSelectedMarketInfo();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const theme = useTheme();

	const markPx = market?.markPx;
	const change24hRaw = get24hChange(market?.prevDayPx, market?.markPx);
	const change24h = change24hRaw ?? 0;
	const isChangePositive = change24h >= 0;
	const fundingNum = toBig(market?.funding)?.toNumber() ?? 0;
	const oiUsd = getOiUsd(market?.openInterest, market?.markPx);

	function handleMarketChange(marketName: string) {
		setSelectedMarket(scope, marketName);
	}

	return (
		<div className={cn("flex flex-col h-full min-h-0 overflow-y-auto", className)}>
			<div className="shrink-0 px-3 pt-3 pb-0">
				<div className="flex items-center justify-between gap-3">
					<TokenSelector selectedMarket={market} onValueChange={handleMarketChange} />

					{isLoading ? (
						<div className="text-right">
							<Skeleton className="h-7 w-28" />
							<Skeleton className="mt-1 h-3 w-20 ml-auto" />
						</div>
					) : (
						<div className="text-right">
							<div className="flex items-end gap-3">
								<div
									className={cn(
										"inline-block text-2xs tabular-nums font-semibold px-1.5 py-0.5 rounded-xs mb-0.5",
										isChangePositive
											? "bg-market-up-100 text-market-up-600"
											: "bg-market-down-100 text-market-down-600",
									)}
								>
									{isChangePositive ? "+" : ""}
									{change24h.toFixed(2)}%
								</div>
								<div className="text-xl font-bold tabular-nums text-text-950">
									{formatUSD(markPx, { compact: false })}
								</div>
							</div>
							<div className="text-3xs text-text-500 tabular-nums">
								Oracle {formatUSD(market?.oraclePx, { compact: false })}
							</div>
						</div>
					)}
				</div>

				{isLoading ? (
					<div className="mt-3 grid grid-cols-3 gap-2 pb-2">
						<Skeleton className="h-10" />
						<Skeleton className="h-10" />
						<Skeleton className="h-10" />
					</div>
				) : (
					<div className="mt-3 grid grid-cols-3 border-t border-border-200/60">
						<StatCell label="24h Volume" value={formatUSD(market?.dayNtlVlm)} />
						<StatCell label="Open Interest" value={formatUSD(oiUsd)} className="border-x border-border-200/60" />
						<div className="flex flex-col gap-0.5 px-3 py-2">
							<span className="text-3xs text-text-500">Funding / 8h</span>
							<div className="flex items-center gap-1">
								<FireIcon className={cn("size-3", getValueColorClass(fundingNum))} />
								<span className={cn("text-2xs tabular-nums font-medium", getValueColorClass(fundingNum))}>
									{formatPercent(fundingNum, {
										minimumFractionDigits: 4,
										signDisplay: "exceptZero",
									})}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex-1 min-h-[320px]">
				<ClientOnly fallback={<Skeleton className="h-full w-full" />}>
					{market ? (
						<TradingViewChart
							symbol={createChartName(market.pairName, market.name)}
							theme={theme === "dark" ? "dark" : "light"}
							extraDisabledFeatures={MOBILE_CHART_DISABLED_FEATURES}
						/>
					) : (
						<Skeleton className="h-full w-full" />
					)}
				</ClientOnly>
			</div>
		</div>
	);
}

interface StatCellProps {
	label: string;
	value: string;
	className?: string;
}

function StatCell({ label, value, className }: StatCellProps) {
	return (
		<div className={cn("flex flex-col gap-0.5 px-3 py-2", className)}>
			<span className="text-3xs text-text-500">{label}</span>
			<span className="text-2xs tabular-nums font-medium text-text-950">{value}</span>
		</div>
	);
}
