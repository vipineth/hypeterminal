import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { TimerIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { TimeTicker } from "@/components/ui/time-ticker";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/constants";
import { getAvgPrice } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDuration, formatNumber, formatPrice } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { toBig } from "@/lib/trade/numbers";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";
import { OrdersTabSkeleton } from "./mobile-card-skeleton";

interface Props {
	className?: string;
}

export function MobileTwapTab({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { data: twapStatesEvent } = useSubscription(
		"twapStates",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const markets = useMarkets();

	const twapStates = twapStatesEvent?.states ?? [];
	const activeOrders = useMemo(
		() =>
			twapStates.map(([twapId, state]) => ({ twapId, state })).sort((a, b) => b.state.timestamp - a.state.timestamp),
		[twapStates],
	);

	const headerCount = isConnected ? `${activeOrders.length}` : FALLBACK_VALUE_PLACEHOLDER;
	const twapStatesStatus = twapStatesEvent ? "active" : "loading";

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`Connect your wallet to view TWAP orders.`}
			</div>
		);
	}

	if (twapStatesStatus === "loading") {
		return <OrdersTabSkeleton />;
	}

	if (activeOrders.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`No active TWAP orders.`}
			</div>
		);
	}

	return (
		<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
			<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-weak">
				<TimerIcon className="size-3" />
				{t`TWAP Orders`}
				<span className="font-semibold text-text-brand ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
				{activeOrders.map(({ twapId, state }) => {
					const isBuy = state.side === "B";
					const totalSize = toBig(state.sz)?.toNumber() ?? Number.NaN;
					const executedSize = toBig(state.executedSz)?.toNumber() ?? 0;
					const avgPrice = getAvgPrice(state.executedNtl, state.executedSz);
					const szDecimals = markets.getSzDecimals(state.coin);
					const creationTime = state.timestamp;
					const totalMinutes = state.minutes;

					return (
						<div
							key={twapId}
							className={cn(
								"rounded-8 border bg-bg-sunken/50",
								isBuy ? "border-stroke-success-strong/30" : "border-stroke-error-strong/30",
							)}
						>
							<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
								<Button variant="ghost" intent="neutral" size="sm" onClick={() => setSelectedMarket(scope, state.coin)}>
									<AssetDisplay
										coin={state.coin}
										nameClassName="text-sm font-semibold"
										subtitle={
											<span
												className={cn("text-xs font-medium uppercase", isBuy ? "text-text-success" : "text-text-error")}
											>
												{isBuy ? t`Buy` : t`Sell`}
											</span>
										}
									/>
								</Button>
								<div className="flex items-center gap-2">
									{state.reduceOnly && (
										<span className="text-xs px-1.5 py-0.5 rounded-8 bg-fill-brand-weak text-text-brand uppercase">
											{t`RO`}
										</span>
									)}
									<Button variant="outline" intent="error" size="sm" className="min-h-[36px]">
										{t`Cancel`}
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
								<MetricCell label={t`Size`} value={formatNumber(totalSize, szDecimals)} />
								<MetricCell
									label={t`Executed`}
									value={formatNumber(executedSize, szDecimals)}
									valueClass={isBuy ? "text-text-success" : "text-text-error"}
								/>
								<MetricCell label={t`Avg Price`} value={formatPrice(avgPrice, { szDecimals })} />
							</div>

							<div className="flex items-center justify-between px-3 py-2.5">
								<div className="text-xs tabular-nums text-text-weak">
									<TimeTicker startTime={creationTime} durationMs={totalMinutes * 60 * 1000} isActive={true} />
									{" / "}
									{formatDuration(totalMinutes)}
								</div>
								<span className="text-xs text-text-weak tabular-nums">
									{formatDateTime(creationTime, { dateStyle: "short", timeStyle: "short" })}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface MetricCellProps {
	label: string;
	value: string;
	valueClass?: string;
}

function MetricCell({ label, value, valueClass }: MetricCellProps) {
	return (
		<div className="px-3 py-2 bg-bg-sunken/50">
			<div className="text-xs text-text-weak mb-0.5">{label}</div>
			<div className={cn("text-xs tabular-nums font-medium", valueClass)}>{value}</div>
		</div>
	);
}
