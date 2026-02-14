import { t } from "@lingui/core/macro";
import { PencilIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import type { Position } from "@/lib/hyperliquid/account/use-user-positions";
import type { Markets } from "@/lib/hyperliquid/markets";
import { getValueColorClass, isPositive, toBig } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";
import { TradingActionButton } from "../components/trading-action-button";
import type { TpSlOrderInfo, TpSlPositionData } from "./positions-tab";

interface Props {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isClosing: boolean;
	isRowClosing: boolean;
	onClose: (assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean, coin: string) => void;
	onOpenTpSl: (data: TpSlPositionData) => void;
	onSelectMarket: (coin: string) => void;
}

interface GridCellProps {
	label: string;
	children: ReactNode;
	className?: string;
}

function GridCell({ label, children, className }: GridCellProps) {
	return (
		<div className={cn("flex flex-col gap-0.5", className)}>
			<span className="text-4xs text-text-600 uppercase tracking-wider">{label}</span>
			<span className="text-2xs tabular-nums">{children}</span>
		</div>
	);
}

export function MobilePositionCard({
	position: p,
	markets,
	markPx: markPxRaw,
	tpSlInfo,
	isClosing,
	isRowClosing,
	onClose,
	onOpenTpSl,
	onSelectMarket,
}: Props) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const assetId = market?.assetId;
	const szDecimals = market?.szDecimals ?? 4;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;

	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const cumFunding = toBig(p.cumFunding.sinceOpen)?.toNumber() ?? Number.NaN;
	const canClose = isPositive(absSize) && typeof assetId === "number" && isPositive(markPx);

	const pnlClass = unrealizedPnl >= 0 ? "text-market-up-600" : "text-market-down-600";
	const fundingClass = getValueColorClass(cumFunding ? -cumFunding : null);
	const hasTpSl = !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice);

	function handleClose() {
		if (!canClose || typeof assetId !== "number") return;
		onClose(assetId, absSize, markPx, szDecimals, isLong, p.coin);
	}

	function handleOpenTpSl() {
		if (typeof assetId !== "number") return;
		onOpenTpSl({
			coin: p.coin,
			assetId,
			isLong,
			size: absSize,
			entryPx: toBig(p.entryPx)?.toNumber() ?? Number.NaN,
			markPx,
			unrealizedPnl,
			roe: toBig(p.returnOnEquity)?.toNumber() ?? Number.NaN,
			szDecimals,
			existingTpPrice: tpSlInfo?.tpPrice,
			existingSlPrice: tpSlInfo?.slPrice,
			existingTpOrderId: tpSlInfo?.tpOrderId,
			existingSlOrderId: tpSlInfo?.slOrderId,
		});
	}

	return (
		<div
			className={cn(
				"border border-border-200/40 rounded-xs bg-surface-execution border-l-2",
				isLong ? "border-l-market-up-600" : "border-l-market-down-600",
			)}
		>
			{/* Identity: asset + direction + leverage */}
			<div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
				<Button
					variant="text"
					size="none"
					onClick={() => onSelectMarket(p.coin)}
					className="gap-1.5"
					aria-label={t`Switch to ${market?.pairName ?? p.coin} market`}
				>
					<AssetDisplay coin={p.coin} nameClassName="text-xs font-medium" />
				</Button>
				<span
					className={cn(
						"text-5xs uppercase px-1.5 py-0.5 rounded-xs font-medium",
						isLong ? "text-market-up-600 bg-market-up-50" : "text-market-down-600 bg-market-down-50",
					)}
				>
					{isLong ? t`Long` : t`Short`}
				</span>
				<span className="text-3xs text-text-600">
					{p.leverage.value}x {p.leverage.type === "isolated" ? t`Iso` : t`Cross`}
				</span>
			</div>

			{/* Hero: PNL + Size — the two most-scanned numbers */}
			<div className="flex items-end justify-between px-3 pb-2.5">
				<div className="flex flex-col">
					<span className={cn("text-sm font-semibold tabular-nums", pnlClass)}>
						{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					</span>
					<span className={cn("text-3xs tabular-nums", pnlClass)}>{formatPercent(p.returnOnEquity, 1)}</span>
				</div>
				<div className="flex flex-col items-end">
					<span className="text-xs tabular-nums">{formatToken(absSize, { decimals: szDecimals, symbol: p.coin })}</span>
					<span className="text-text-500 text-3xs tabular-nums">{formatUSD(p.positionValue, { compact: true })}</span>
				</div>
			</div>

			{/* Data grid: prices + margin/funding in one block */}
			<div className="border-t border-border-200/30 px-3 py-2 grid grid-cols-3 gap-x-3 gap-y-2.5">
				<GridCell label={t`Entry`}>
					<span className="text-text-600">{formatPrice(p.entryPx, { szDecimals })}</span>
				</GridCell>
				<GridCell label={t`Mark`}>{formatPrice(markPx, { szDecimals })}</GridCell>
				<GridCell label={t`Liq`}>
					<span className="text-market-down-600">{formatPrice(p.liquidationPx, { szDecimals })}</span>
				</GridCell>
				<GridCell label={t`Margin`}>{formatUSD(p.marginUsed)}</GridCell>
				<GridCell label={t`Funding`}>
					<span className={fundingClass}>
						{formatUSD(cumFunding ? -cumFunding : null, { signDisplay: "exceptZero" })}
					</span>
				</GridCell>
			</div>

			{/* Action bar: TP/SL + Close */}
			<div className="border-t border-border-200/30 px-3 py-2 flex items-center justify-between">
				<button
					type="button"
					onClick={handleOpenTpSl}
					disabled={typeof assetId !== "number"}
					className={cn(
						"inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
						!hasTpSl && "text-text-400",
					)}
				>
					<span className="text-4xs text-text-600 uppercase tracking-wider">{t`TP/SL`}</span>
					{tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? (
						<>
							<span className="flex items-center gap-0.5 text-2xs tabular-nums">
								<span className="text-market-up-600">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
								<span className="text-text-600">/</span>
								<span className="text-market-down-600">{formatPrice(tpSlInfo.slPrice, { szDecimals })}</span>
							</span>
							<PencilIcon className="size-3 text-text-400" />
						</>
					) : hasTpSl ? (
						<>
							<span className="text-2xs tabular-nums">
								{tpSlInfo?.tpPrice ? (
									<span className="text-market-up-600">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
								) : (
									<span className="text-market-down-600">{formatPrice(tpSlInfo?.slPrice, { szDecimals })}</span>
								)}
							</span>
							<PlusIcon className="size-3 text-text-400" />
						</>
					) : (
						<span className="flex items-center gap-0.5 text-2xs text-text-600 font-medium">
							<PlusIcon className="size-3" />
							{t`Add`}
						</span>
					)}
				</button>

				<TradingActionButton
					variant="outlined"
					size="sm"
					aria-label={t`Close position`}
					onClick={handleClose}
					disabled={!canClose || isClosing}
					className="gap-1"
				>
					<XIcon className="size-3" />
					{isRowClosing ? t`Closing...` : t`Close`}
				</TradingActionButton>
			</div>
		</div>
	);
}
