import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CrosshairIcon, PencilIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { LIQ_WARNING_PROXIMITY } from "@/config/trade";
import { isPerpLike } from "@/domain/market/model";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import type { Position } from "@/lib/hyperliquid";
import type { Markets } from "@/lib/hyperliquid/markets";
import { isPositive, toBig } from "@/lib/trade/numbers";
import type { TpSlOrderInfo } from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { getValueColorClass } from "@/lib/ui/value-color";
import { AssetBadge } from "../components/asset-badge";
import type { ClosePositionData, LimitClosePositionData, TpSlPositionData } from "../positions/position-dialog-types";
import { MetricCell } from "./metric-cell";

interface Props {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isRowClosing: boolean;
	closeErrorMessage: string | null;
	onClose: (data: ClosePositionData) => void;
	onLimitClose: (data: LimitClosePositionData) => void;
	onOpenTpSl: (data: TpSlPositionData) => void;
	onSelectMarket: (coin: string, side: Side) => void;
}

export function MobilePositionCard({
	position: p,
	markets,
	markPx: markPxRaw,
	tpSlInfo,
	isRowClosing,
	closeErrorMessage,
	onClose,
	onLimitClose,
	onOpenTpSl,
	onSelectMarket,
}: Props) {
	const [confirmingClose, setConfirmingClose] = useState(false);

	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const displayName = market?.pairName ?? p.coin;
	const perpMarket = market && isPerpLike(market) ? market : undefined;
	const szDecimals = market?.szDecimals;
	const priceDecimals = market?.priceDecimals;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const roe = toBig(p.returnOnEquity)?.toNumber() ?? Number.NaN;
	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null &&
		Number.isFinite(markPx) &&
		Number.isFinite(liqPx) &&
		Math.abs(liqPx - markPx) / markPx <= LIQ_WARNING_PROXIMITY;

	const fundingRaw = toBig(p.cumFunding.sinceOpen)?.toNumber();
	const fundingValue = formatUSD(fundingRaw != null ? -fundingRaw : null, { signDisplay: "exceptZero" });
	const fundingClass = getValueColorClass(fundingRaw != null ? -fundingRaw : 0);

	const canClose = isPositive(absSize) && perpMarket !== undefined && isPositive(markPx);
	const pnlClass = getValueColorClass(unrealizedPnl);
	const hasTpSl = !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice);

	function handleClose() {
		if (!canClose || !perpMarket) return;
		onClose({
			market: perpMarket,
			coin: p.coin,
			size: toBig(p.szi)?.abs().toFixed() ?? "0",
			markPx: markPxRaw ?? "",
			isLong,
			unrealizedPnl,
			roe,
		});
	}

	function handleLimitClose() {
		if (!canClose || !perpMarket) return;
		onLimitClose({
			coin: p.coin,
			market: perpMarket,
			isLong,
			size: absSize,
			entryPx,
			markPx,
			unrealizedPnl,
			roe,
		});
	}

	function handleOpenTpSl() {
		if (!perpMarket) return;
		onOpenTpSl({
			coin: p.coin,
			market: perpMarket,
			isLong,
			size: absSize,
			entryPx,
			markPx,
			unrealizedPnl,
			roe,
			existingTpPrice: tpSlInfo?.tpPrice,
			existingSlPrice: tpSlInfo?.slPrice,
			existingTpOrderId: tpSlInfo?.tpOrderId,
			existingSlOrderId: tpSlInfo?.slOrderId,
		});
	}

	return (
		<div className="rounded-xs border border-stroke-weak bg-surface overflow-hidden">
			<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
				<div className="flex items-center gap-2">
					<AssetBadge
						coin={p.coin}
						side={isLong ? "buy" : "sell"}
						onClick={() => onSelectMarket(p.coin, isLong ? "buy" : "sell")}
						aria-label={
							isLong
								? t`Switch to ${displayName} market, long position`
								: t`Switch to ${displayName} market, short position`
						}
						nameClassName="text-sm"
					/>
					<span className={cn("text-2xs font-medium uppercase", isLong ? "text-success" : "text-error")}>
						{isLong ? t`Long` : t`Short`}
					</span>
				</div>
				<div className={cn("text-xs tabular-nums font-medium", pnlClass)}>
					{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					<span className="text-2xs ml-1 font-normal text-fg-muted">{formatPercent(p.returnOnEquity, 1)}</span>
				</div>
			</div>

			<div className="grid grid-cols-3 divide-x divide-stroke-weak">
				<MetricCell
					label={t`Size`}
					value={
						<>
							<span className="whitespace-nowrap">
								{formatToken(absSize, { decimals: szDecimals, symbol: p.coin })}
							</span>
							<div className="text-2xs text-fg-muted font-normal tabular-nums mt-0.5">
								{formatUSD(p.positionValue, { compact: true })}
							</div>
						</>
					}
				/>
				<MetricCell label={t`Entry`} value={formatPrice(entryPx, { decimals: priceDecimals })} />
				<MetricCell label={t`Mark`} value={formatPrice(markPx, { decimals: priceDecimals })} />
			</div>
			<div className="grid grid-cols-3 divide-x divide-stroke-weak border-t border-stroke-weak">
				<MetricCell
					label={p.leverage.type === "isolated" ? t`Margin · Iso` : t`Margin`}
					value={formatUSD(p.marginUsed)}
				/>
				<MetricCell
					label={t`Liq`}
					value={formatPrice(p.liquidationPx, { decimals: priceDecimals })}
					valueClass={liqIsNear ? "text-error" : undefined}
				/>
				<MetricCell label={t`Funding`} value={fundingValue} valueClass={fundingClass} />
			</div>

			<div className="flex gap-1.5 px-2.5 py-1.5 border-t border-stroke-weak">
				{confirmingClose ? (
					<>
						<Button
							variant="outline"
							intent="neutral"
							size="xs"
							className="flex-1 justify-center"
							onClick={() => setConfirmingClose(false)}
						>
							{t`Cancel`}
						</Button>
						<Button
							variant="outline"
							intent="error"
							size="xs"
							className="flex-1 justify-center"
							onClick={handleClose}
							disabled={!canClose || isRowClosing}
							iconLeft={isRowClosing ? <Spinner className="size-3" /> : <XIcon className="size-3.5" />}
						>
							{t`Confirm Close`}
						</Button>
					</>
				) : (
					<>
						<Button
							variant="outline"
							intent="neutral"
							size="xs"
							className="flex-1 justify-center touch-target"
							onClick={handleOpenTpSl}
							disabled={!perpMarket}
							iconLeft={hasTpSl ? <CrosshairIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
						>
							{hasTpSl ? (
								<span className="inline-flex items-center gap-1 tabular-nums truncate">
									{tpSlInfo?.tpPrice && (
										<span className="text-success">{formatPrice(tpSlInfo.tpPrice, { decimals: priceDecimals })}</span>
									)}
									{tpSlInfo?.tpPrice && tpSlInfo?.slPrice && <span className="text-fg-muted"> / </span>}
									{tpSlInfo?.slPrice && (
										<span className="text-error">{formatPrice(tpSlInfo.slPrice, { decimals: priceDecimals })}</span>
									)}
									<PencilIcon className="size-3 text-fg-disabled" />
								</span>
							) : (
								t`TP/SL`
							)}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="xs"
							className="flex-1 justify-center touch-target"
							onClick={handleLimitClose}
							disabled={!canClose || isRowClosing}
						>
							{t`Limit Close`}
						</Button>
						<Button
							variant="outline"
							intent="error"
							size="xs"
							className="flex-1 justify-center touch-target"
							onClick={() => setConfirmingClose(true)}
							disabled={!canClose || isRowClosing}
							iconLeft={<XIcon className="size-3.5" />}
						>
							{t`Close`}
						</Button>
					</>
				)}
			</div>
			{closeErrorMessage && (
				<div className="px-3 py-1.5 text-xs text-error border-t border-stroke-weak">{closeErrorMessage}</div>
			)}
		</div>
	);
}
