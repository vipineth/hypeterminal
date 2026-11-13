import { t } from "@lingui/core/macro";
import { ArrowSquareOutIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { MAX_HISTORY_ROWS } from "@/config/trade";
import { cn } from "@/lib/cn";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatDateTimeShort, formatNumber, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { toNumber } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetBadge } from "../components/asset-badge";
import { MetricCell } from "./metric-cell";

interface Props {
	className?: string;
}

export function MobileHistoryTab({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const markets = useMarkets();
	const {
		data: fillsEvent,
		status,
		error,
	} = useSubscription(
		"userFills",
		{ user: address ?? "0x0", aggregateByTime: true },
		{ enabled: isConnected && !!address },
	);

	const fills = fillsEvent?.fills?.slice(0, MAX_HISTORY_ROWS).sort((a, b) => b.time - a.time) ?? [];
	const headerCount = isConnected ? `${fills.length}` : FALLBACK_VALUE_PLACEHOLDER;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view trade history.`}
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-error">
				<span>{t`Failed to load trade history.`}</span>
				{error instanceof Error && <span className="mt-1 text-xs text-fg-muted">{error.message}</span>}
			</div>
		);
	}

	if (status === "active" && fills.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">{t`No fills found.`}</div>
		);
	}

	return (
		<Skeleton name="history-tab" loading={status === "subscribing" || status === "idle"}>
			<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-fg-muted">
					<ClockCounterClockwiseIcon className="size-3" />
					{t`Trade History`}
					<span className="font-semibold text-brand ml-auto tabular-nums">{headerCount}</span>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{fills.map((fill) => {
						const market = markets.getMarket(fill.coin);
						const fee = toNumber(fill.fee);
						const closedPnl = toNumber(fill.closedPnl);
						const showPnl = closedPnl !== null && closedPnl !== 0;
						const isLiquidation = !!fill.liquidation;
						const isBuy = fill.side === "B";
						const explorerUrl = getExplorerTxUrl(fill.hash);

						return (
							<div
								key={`${fill.hash}-${fill.tid}`}
								className="rounded-xs border border-stroke-weak bg-surface overflow-hidden"
							>
								<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
									<div className="flex items-center gap-2">
										<AssetBadge
											coin={fill.coin}
											side={isBuy ? "buy" : "sell"}
											onClick={() => setSelectedMarket(scope, fill.coin)}
											nameClassName="text-sm"
										/>
										<span
											className={cn(
												"text-2xs font-medium uppercase",
												isLiquidation ? "text-error" : isBuy ? "text-success" : "text-error",
											)}
										>
											{isLiquidation ? t`Liquidated` : fill.dir}
										</span>
									</div>
									{showPnl && (
										<div className={cn("text-xs font-medium tabular-nums", getValueColorClass(closedPnl))}>
											{formatUSD(closedPnl, { signDisplay: "exceptZero" })}
										</div>
									)}
								</div>

								<div className="grid grid-cols-3 divide-x divide-stroke-weak">
									<MetricCell label={t`Price`} value={formatPrice(fill.px, { decimals: market?.priceDecimals })} />
									<MetricCell label={t`Size`} value={formatNumber(fill.sz, market?.szDecimals)} />
									<MetricCell
										label={t`Fee`}
										value={formatToken(fill.fee, { symbol: fill.feeToken })}
										valueClass={fee !== null ? getValueColorClass(fee) : undefined}
									/>
								</div>

								<div className="flex items-center justify-between px-3 py-1.5">
									<span className="text-xs text-fg-muted tabular-nums">{formatDateTimeShort(fill.time)}</span>
									{explorerUrl && (
										<a
											href={explorerUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg active:text-fg touch-manipulation"
										>
											{t`Explorer`}
											<ArrowSquareOutIcon className="size-3" aria-hidden="true" />
										</a>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</Skeleton>
	);
}
