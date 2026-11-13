import { TableCell, TableRow, Tooltip } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { PencilIcon, PlusIcon } from "@phosphor-icons/react";
import { LIQ_WARNING_PROXIMITY } from "@/config/trade";
import { isListed, isPerpLike } from "@/domain/market/model";
import { cn } from "@/lib/cn";
import { formatLiquidationPrice, formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import type { Position } from "@/lib/hyperliquid";
import type { Markets } from "@/lib/hyperliquid/markets";
import { isPositive, toBig } from "@/lib/trade/numbers";
import type { TpSlOrderInfo } from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { getValueColorClass } from "@/lib/ui/value-color";
import { AssetBadge } from "../components/asset-badge";
import { PositionActionsDropdown } from "./position-actions-dropdown";
import type { ClosePositionData, LimitClosePositionData, TpSlPositionData } from "./position-dialog-types";
import {
	positionsPanelRowHoverClass,
	positionsPanelRowStripeClass,
	positionsPanelTableCellClass,
} from "./positions-panel-table-styles";

interface Props {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isRowClosing: boolean;
	isEven: boolean;
	onClose: (data: ClosePositionData) => void;
	onLimitClose: (data: LimitClosePositionData) => void;
	onReverse: (data: ClosePositionData) => void;
	onOpenTpSl: (data: TpSlPositionData) => void;
	onSelectMarket: (coin: string, side: Side) => void;
}

export function PositionRow({
	position: p,
	markets,
	markPx: markPxRaw,
	tpSlInfo,
	isRowClosing,
	isEven,
	onClose,
	onLimitClose,
	onReverse,
	onOpenTpSl,
	onSelectMarket,
}: Props) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const perpMarket = market && isPerpLike(market) ? market : undefined;
	const szDecimals = market?.szDecimals;
	const priceDecimals = market?.priceDecimals;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const displayName = market?.pairName ?? p.coin;

	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null &&
		Number.isFinite(markPx) &&
		Number.isFinite(liqPx) &&
		Math.abs(liqPx - markPx) / markPx <= LIQ_WARNING_PROXIMITY;

	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const roe = toBig(p.returnOnEquity)?.toNumber() ?? Number.NaN;
	const cumFunding = toBig(p.cumFunding.sinceOpen)?.toNumber() ?? Number.NaN;
	const canClose = isPositive(absSize) && perpMarket !== undefined && isPositive(markPx);

	const pnlClass = getValueColorClass(unrealizedPnl);
	const fundingClass = getValueColorClass(cumFunding ? -cumFunding : null);
	const hasTpSl = !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice);

	function renderTpSlContent() {
		if (tpSlInfo?.tpPrice && tpSlInfo?.slPrice) {
			return (
				<>
					<div className="flex items-center gap-1 text-2xs tabular-nums">
						<span className="text-success/70">{formatPrice(tpSlInfo.tpPrice, { decimals: priceDecimals })}</span>
						<span className="text-fg-muted">/</span>
						<span className="text-error/70">{formatPrice(tpSlInfo.slPrice, { decimals: priceDecimals })}</span>
					</div>
					<PencilIcon className="size-3 text-fg-muted group-hover:text-fg transition-colors" />
				</>
			);
		}
		if (hasTpSl) {
			return (
				<>
					<div className="flex items-center gap-1 text-2xs tabular-nums">
						{tpSlInfo?.tpPrice ? (
							<span className="text-success/70">{formatPrice(tpSlInfo.tpPrice, { decimals: priceDecimals })}</span>
						) : (
							<span className="text-error/70">{formatPrice(tpSlInfo?.slPrice, { decimals: priceDecimals })}</span>
						)}
					</div>
					<PlusIcon className="size-3 text-fg-muted group-hover:text-fg transition-colors" />
				</>
			);
		}
		return (
			<div className="flex items-center gap-0.5 text-2xs font-medium text-fg-muted group-hover:text-fg transition-colors">
				<PlusIcon className="size-3" />
				<span>{t`Add`}</span>
			</div>
		);
	}

	function buildCloseData(): ClosePositionData | null {
		if (!canClose || !perpMarket) return null;
		return {
			market: perpMarket,
			coin: p.coin,
			size: toBig(p.szi)?.abs().toFixed() ?? "0",
			markPx: markPxRaw ?? "",
			isLong,
			unrealizedPnl,
			roe,
		};
	}

	function handleClose() {
		const data = buildCloseData();
		if (data) onClose(data);
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

	function handleReverse() {
		const data = buildCloseData();
		if (data) onReverse(data);
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
		<TableRow className={cn(positionsPanelRowHoverClass, isEven && positionsPanelRowStripeClass)}>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "min-w-0 text-fg")}>
				<AssetBadge
					coin={p.coin}
					side={isLong ? "buy" : "sell"}
					onClick={() => onSelectMarket(p.coin, isLong ? "buy" : "sell")}
					aria-label={
						isLong
							? t`Switch to ${displayName} market, long position`
							: t`Switch to ${displayName} market, short position`
					}
				/>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}>
				<div className="flex flex-col items-end gap-px">
					<span className="text-xs font-semibold tabular-nums leading-tight">
						{formatToken(absSize, {
							decimals: szDecimals,
							symbol: p.coin,
						})}
					</span>
					<span className="text-2xs text-fg-muted tabular-nums leading-tight">
						({formatUSD(p.positionValue, { compact: true })})
					</span>
				</div>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right text-fg")}>
				<div className="flex flex-col items-end gap-px">
					<span className="text-xs font-semibold tabular-nums leading-tight">{formatUSD(p.marginUsed)}</span>
					<span className="text-2xs font-medium text-fg-muted leading-tight">
						{p.leverage.type === "isolated" ? t`Isolated` : t`Cross`}
					</span>
				</div>
			</TableCell>
			<TableCell
				size="dense"
				className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg-muted whitespace-nowrap")}
			>
				<span className="tabular-nums">{formatPrice(p.entryPx, { decimals: priceDecimals })}</span>
			</TableCell>
			<TableCell
				size="dense"
				className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg whitespace-nowrap")}
			>
				<span className="text-xs font-semibold tabular-nums">{formatPrice(markPx, { decimals: priceDecimals })}</span>
			</TableCell>
			<TableCell
				size="dense"
				className={cn(
					positionsPanelTableCellClass,
					"text-right tabular-nums min-w-0",
					liqIsNear ? "text-error font-medium" : "text-fg-muted",
				)}
			>
				<span className="block truncate" title={formatPrice(p.liquidationPx, { decimals: priceDecimals })}>
					{formatLiquidationPrice(p.liquidationPx, priceDecimals)}
				</span>
			</TableCell>
			<TableCell
				size="dense"
				className={cn(positionsPanelTableCellClass, "text-right tabular-nums whitespace-nowrap", fundingClass)}
			>
				<span className="font-medium tabular-nums">
					{formatUSD(cumFunding ? -cumFunding : null, { signDisplay: "exceptZero" })}
				</span>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right")}>
				<div className={cn("flex flex-col items-end gap-px tabular-nums", pnlClass)}>
					<span className="text-xs font-semibold leading-tight">
						{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					</span>
					<span className={cn("text-2xs leading-tight opacity-90", pnlClass)}>
						({formatPercent(p.returnOnEquity, 1)})
					</span>
				</div>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right")}>
				<Tooltip content={tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? t`Edit TP/SL` : t`Add TP/SL`} side="left">
					<button
						type="button"
						onClick={handleOpenTpSl}
						disabled={!perpMarket}
						className={cn(
							"group inline-flex items-center gap-1.5 cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
							!hasTpSl && "text-fg-disabled hover:text-fg-muted",
						)}
					>
						{renderTpSlContent()}
					</button>
				</Tooltip>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right")}>
				<PositionActionsDropdown
					canClose={canClose}
					canReverse={perpMarket !== undefined && isListed(perpMarket)}
					isRowClosing={isRowClosing}
					onMarketClose={handleClose}
					onLimitClose={handleLimitClose}
					onReverse={handleReverse}
				/>
			</TableCell>
		</TableRow>
	);
}
