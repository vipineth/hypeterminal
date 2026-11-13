import { t } from "@lingui/core/macro";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { MAX_HISTORY_ROWS } from "@/config/trade";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice, formatToken } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { getSideLabel } from "@/lib/trade/open-orders";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetBadge } from "../components/asset-badge";
import { MetricCell } from "./metric-cell";

interface Props {
	className?: string;
}

export function MobileOrdersHistoryTab({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const markets = useMarkets();
	const {
		data: historicalOrdersEvent,
		status,
		error,
	} = useSubscription("userHistoricalOrders", { user: address ?? "0x0" }, { enabled: isConnected && !!address });

	const orders =
		historicalOrdersEvent?.orderHistory
			?.slice()
			.sort((a, b) => b.statusTimestamp - a.statusTimestamp)
			.slice(0, MAX_HISTORY_ROWS) ?? [];

	const headerCount = isConnected ? `${orders.length}` : FALLBACK_VALUE_PLACEHOLDER;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view order history.`}
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-error">
				<span>{t`Failed to load order history.`}</span>
				{error instanceof Error && <span className="mt-1 text-xs text-fg-muted">{error.message}</span>}
			</div>
		);
	}

	if (status === "active" && orders.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`No order history found.`}
			</div>
		);
	}

	return (
		<Skeleton name="orders-history-tab" loading={status === "subscribing" || status === "idle"}>
			<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-fg-muted">
					<ClockCounterClockwiseIcon className="size-3" />
					{t`Order History`}
					<span className="font-semibold text-brand ml-auto tabular-nums">{headerCount}</span>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{orders.map((entry) => {
						const { order } = entry;
						const market = markets.getMarket(order.coin);
						const isLong = order.side === "B";

						return (
							<div
								key={`${order.oid}-${entry.statusTimestamp}`}
								className="rounded-xs border border-stroke-weak bg-surface overflow-hidden"
							>
								<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
									<div className="flex items-center gap-2">
										<AssetBadge
											coin={order.coin}
											side={isLong ? "buy" : "sell"}
											onClick={() => setSelectedMarket(scope, order.coin)}
											nameClassName="text-sm"
										/>
										<span className={cn("text-2xs font-medium uppercase", isLong ? "text-success" : "text-error")}>
											{getSideLabel(order.side, market?.kind)}
										</span>
									</div>
									<span
										className={cn(
											"text-xs px-1.5 py-0.5 rounded-8 capitalize",
											entry.status === "filled"
												? "bg-success-soft text-success"
												: entry.status === "canceled"
													? "bg-error-soft text-error"
													: "bg-surface text-fg-muted",
										)}
									>
										{entry.status}
									</span>
								</div>

								<div className="grid grid-cols-3 divide-x divide-stroke-weak">
									<MetricCell label={t`Type`} value={order.orderType} />
									<MetricCell
										label={t`Price`}
										value={formatPrice(order.limitPx, { decimals: market?.priceDecimals })}
									/>
									<MetricCell label={t`Size`} value={formatToken(order.origSz, market?.szDecimals)} />
								</div>

								<div className="flex items-center justify-between px-3 py-1.5">
									<span className="text-xs text-fg-muted tabular-nums">
										{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
									</span>
									<span className="text-xs text-fg-muted tabular-nums">
										{t`Updated`} {formatDateTime(entry.statusTimestamp, { dateStyle: "short", timeStyle: "short" })}
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
