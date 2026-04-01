import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTime, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { getSideClass, getSideLabel } from "@/lib/trade/open-orders";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";
import { HistoryTabSkeleton } from "./mobile-card-skeleton";

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
			.slice(0, 200) ?? [];

	const headerCount = isConnected ? `${orders.length}` : FALLBACK_VALUE_PLACEHOLDER;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`Connect your wallet to view order history.`}
			</div>
		);
	}

	if (status === "subscribing" || status === "idle") {
		return <HistoryTabSkeleton />;
	}

	if (status === "error") {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-error">
				<span>{t`Failed to load order history.`}</span>
				{error instanceof Error && <span className="mt-1 text-xs text-text-weak">{error.message}</span>}
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`No order history found.`}
			</div>
		);
	}

	return (
		<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
			<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-weak">
				<ClockCounterClockwiseIcon className="size-3" />
				{t`Order History`}
				<span className="font-semibold text-text-brand ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
				{orders.map((entry) => {
					const { order } = entry;
					const market = markets.getMarket(order.coin);
					const isLong = order.side === "B";

					return (
						<div
							key={`${order.oid}-${entry.statusTimestamp}`}
							className={cn(
								"rounded-8 border bg-bg-sunken/50",
								isLong ? "border-stroke-success-strong/30" : "border-stroke-error-strong/30",
							)}
						>
							<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
								<Button variant="ghost" intent="neutral" size="sm" onClick={() => setSelectedMarket(scope, order.coin)}>
									<AssetDisplay
										coin={order.coin}
										nameClassName="text-sm font-semibold"
										subtitle={
											<span className={cn("text-xs font-medium uppercase", getSideClass(order.side))}>
												{getSideLabel(order.side, market?.kind)}
											</span>
										}
									/>
								</Button>
								<span
									className={cn(
										"text-xs px-1.5 py-0.5 rounded-8 capitalize",
										entry.status === "filled"
											? "bg-fill-success-weak text-text-success"
											: entry.status === "canceled"
												? "bg-fill-error-weak text-text-error"
												: "bg-bg-raised text-text-weak",
									)}
								>
									{entry.status}
								</span>
							</div>

							<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
								<MetricCell label={t`Type`} value={order.orderType} />
								<MetricCell label={t`Price`} value={formatUSD(order.limitPx, { compact: false })} />
								<MetricCell label={t`Size`} value={formatToken(order.origSz, market?.szDecimals)} />
							</div>

							<div className="flex items-center justify-between px-3 py-2.5">
								<span className="text-xs text-text-weak tabular-nums">
									{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
								</span>
								<span className="text-xs text-text-weak tabular-nums">
									{t`Updated`} {formatDateTime(entry.statusTimestamp, { dateStyle: "short", timeStyle: "short" })}
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
}

function MetricCell({ label, value }: MetricCellProps) {
	return (
		<div className="px-3 py-2 bg-bg-sunken/50">
			<div className="text-xs text-text-weak mb-0.5">{label}</div>
			<div className="text-xs tabular-nums font-medium">{value}</div>
		</div>
	);
}
