import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { TimerIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { TimeTicker } from "@/components/ui/time-ticker";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/app";
import { getAvgPrice } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDuration, formatNumber, formatPrice } from "@/lib/format";
import { useExchange, useMarkets, useSubscription } from "@/lib/hyperliquid";
import { toBig } from "@/lib/trade/numbers";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetBadge } from "../components/asset-badge";
import { MetricCell } from "./metric-cell";

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
	const { mutate: cancelTwap, isPending: isCancelling } = useExchange("twapCancel");

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
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view TWAP orders.`}
			</div>
		);
	}

	if (twapStatesStatus !== "loading" && activeOrders.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`No active TWAP orders.`}
			</div>
		);
	}

	return (
		<Skeleton name="twap-tab" loading={twapStatesStatus === "loading"}>
			<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-fg-muted">
					<TimerIcon className="size-3" />
					{t`TWAP Orders`}
					<span className="font-semibold text-brand ml-auto tabular-nums">{headerCount}</span>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{activeOrders.map(({ twapId, state }) => {
						const isBuy = state.side === "B";
						const totalSize = toBig(state.sz)?.toNumber() ?? Number.NaN;
						const executedSize = toBig(state.executedSz)?.toNumber() ?? 0;
						const avgPrice = getAvgPrice(state.executedNtl, state.executedSz);
						const szDecimals = markets.getMarket(state.coin)?.szDecimals;
						const creationTime = state.timestamp;
						const totalMinutes = state.minutes;

						return (
							<div key={twapId} className="rounded-xs border border-stroke-weak bg-surface overflow-hidden">
								<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
									<div className="flex items-center gap-2">
										<AssetBadge
											coin={state.coin}
											side={isBuy ? "buy" : "sell"}
											onClick={() => setSelectedMarket(scope, state.coin)}
											nameClassName="text-sm"
										/>
										<span className={cn("text-2xs font-medium uppercase", isBuy ? "text-success" : "text-error")}>
											{isBuy ? t`Buy` : t`Sell`}
										</span>
									</div>
									<div className="flex items-center gap-2">
										{state.reduceOnly && (
											<span className="text-xs px-1.5 py-0.5 rounded-xs bg-brand-soft text-brand uppercase">
												{t`RO`}
											</span>
										)}
										<Button
											variant="outline"
											intent="error"
											size="sm"
											disabled={isCancelling}
											onClick={() => {
												const assetId = markets.getMarket(state.coin)?.assetId;
												if (typeof assetId !== "number") return;
												cancelTwap({ a: assetId, t: twapId });
											}}
										>
											{t`Cancel`}
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-3 divide-x divide-stroke-weak">
									<MetricCell label={t`Size`} value={formatNumber(totalSize, szDecimals)} />
									<MetricCell
										label={t`Executed`}
										value={formatNumber(executedSize, szDecimals)}
										valueClass={isBuy ? "text-success" : "text-error"}
									/>
									<MetricCell label={t`Avg Price`} value={formatPrice(avgPrice, { szDecimals })} />
								</div>

								<div className="flex items-center justify-between px-3 py-1.5">
									<div className="text-xs tabular-nums text-fg-muted">
										<TimeTicker startTime={creationTime} durationMs={totalMinutes * 60 * 1000} isActive={true} />
										{" / "}
										{formatDuration(totalMinutes)}
									</div>
									<span className="text-xs text-fg-muted tabular-nums">
										{formatDateTime(creationTime, { dateStyle: "short", timeStyle: "short" })}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</Skeleton>
	);
}
