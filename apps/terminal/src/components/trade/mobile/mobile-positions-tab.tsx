import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CrosshairIcon, ListChecksIcon, PencilIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { Spinner } from "@/components/ui/spinner";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/constants";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { type Position, useExchange, useMarkets, useSubscription, useUserPositions } from "@/lib/hyperliquid";
import type { Markets } from "@/lib/hyperliquid/markets";
import { getValueColorClass, isPositive, toBig } from "@/lib/trade/numbers";
import { isStopOrder, isTakeProfitOrder } from "@/lib/trade/open-orders";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";
import { PositionLimitCloseModal } from "../positions/position-limit-close-modal";
import { PositionTpSlModal } from "../positions/position-tpsl-modal";
import { PositionsTabSkeleton } from "./mobile-card-skeleton";

interface TpSlOrderInfo {
	tpPrice?: number;
	slPrice?: number;
	tpOrderId?: number;
	slOrderId?: number;
}

interface TpSlPositionData {
	coin: string;
	assetId: number;
	isLong: boolean;
	size: number;
	entryPx: number;
	markPx: number;
	unrealizedPnl: number;
	roe: number;
	szDecimals: number;
	existingTpPrice?: number;
	existingSlPrice?: number;
	existingTpOrderId?: number;
	existingSlOrderId?: number;
}

interface LimitClosePositionData {
	coin: string;
	assetId: number;
	isLong: boolean;
	size: number;
	entryPx: number;
	markPx: number;
	unrealizedPnl: number;
	roe: number;
	szDecimals: number;
}

interface MobilePositionCardProps {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isClosing: boolean;
	isRowClosing: boolean;
	onClose: (assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean, coin: string) => void;
	onLimitClose: (data: LimitClosePositionData) => void;
	onOpenTpSl: (data: TpSlPositionData) => void;
	onSelectMarket: (coin: string) => void;
}

function MobilePositionCard({
	position: p,
	markets,
	markPx: markPxRaw,
	tpSlInfo,
	isClosing,
	isRowClosing,
	onClose,
	onLimitClose,
	onOpenTpSl,
	onSelectMarket,
}: MobilePositionCardProps) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const assetId = market?.assetId;
	const szDecimals = market?.szDecimals ?? 4;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null && Number.isFinite(markPx) && Number.isFinite(liqPx) && Math.abs(liqPx - markPx) / markPx <= 0.1;

	const canClose = isPositive(absSize) && typeof assetId === "number" && isPositive(markPx);
	const pnlClass = getValueColorClass(unrealizedPnl);
	const hasTpSl = !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice);

	function handleClose() {
		if (!canClose || typeof assetId !== "number") return;
		onClose(assetId, absSize, markPx, szDecimals, isLong, p.coin);
	}

	function handleLimitClose() {
		if (!canClose || typeof assetId !== "number") return;
		onLimitClose({
			coin: p.coin,
			assetId,
			isLong,
			size: absSize,
			entryPx,
			markPx,
			unrealizedPnl,
			roe: toBig(p.returnOnEquity)?.toNumber() ?? 0,
			szDecimals,
		});
	}

	function handleOpenTpSl() {
		if (typeof assetId !== "number") return;
		onOpenTpSl({
			coin: p.coin,
			assetId,
			isLong,
			size: absSize,
			entryPx,
			markPx,
			unrealizedPnl,
			roe: toBig(p.returnOnEquity)?.toNumber() ?? 0,
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
				"rounded-8 border bg-bg-sunken/50",
				isLong ? "border-stroke-success-strong/30" : "border-stroke-error-strong/30",
			)}
		>
			<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
				<Button variant="ghost" intent="neutral" size="sm" onClick={() => onSelectMarket(p.coin)}>
					<AssetDisplay
						coin={p.coin}
						nameClassName="text-sm font-semibold"
						subtitle={
							<span className={cn("text-xs font-medium uppercase", isLong ? "text-text-success" : "text-text-error")}>
								{isLong ? t`Long` : t`Short`}
							</span>
						}
					/>
				</Button>
				<div className="text-right">
					<div className={cn("text-sm font-semibold tabular-nums", pnlClass)}>
						{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					</div>
					<div className={cn("text-xs tabular-nums", pnlClass)}>{formatPercent(p.returnOnEquity, 1)}</div>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
				<MetricCell
					label={t`Size`}
					value={formatToken(absSize, { decimals: szDecimals, symbol: p.coin })}
					sub={formatUSD(p.positionValue, { compact: true })}
				/>
				<MetricCell label={t`Entry`} value={formatPrice(entryPx, { szDecimals })} />
				<MetricCell label={t`Mark`} value={formatPrice(markPx, { szDecimals })} />
				<MetricCell
					label={t`Margin`}
					value={formatUSD(p.marginUsed)}
					sub={p.leverage.type === "isolated" ? t`Isolated` : t`Cross`}
				/>
				<MetricCell
					label={t`Liq`}
					value={formatPrice(p.liquidationPx, { szDecimals })}
					valueClass={liqIsNear ? "text-text-error" : "text-text-weak"}
				/>
				<MetricCell
					label={t`Funding`}
					value={formatUSD(
						toBig(p.cumFunding.sinceOpen)?.toNumber() ? -(toBig(p.cumFunding.sinceOpen)?.toNumber() ?? 0) : null,
						{ signDisplay: "exceptZero" },
					)}
				/>
			</div>

			<div className="flex items-center gap-2 px-3 py-2.5">
				<button
					type="button"
					onClick={handleOpenTpSl}
					disabled={typeof assetId !== "number"}
					className={cn(
						"flex items-center gap-1 text-xs min-h-[36px] px-2 rounded-8 transition-all touch-manipulation",
						"border border-stroke-weak/40 hover:border-fg-400",
						"active:scale-[0.97] active:bg-bg-raised/50",
						"disabled:opacity-50 disabled:cursor-not-allowed",
					)}
				>
					{hasTpSl ? (
						<>
							<CrosshairIcon className="size-3.5 text-text-weak" />
							<span className="tabular-nums text-xs">
								{tpSlInfo?.tpPrice && (
									<span className="text-text-success">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
								)}
								{tpSlInfo?.tpPrice && tpSlInfo?.slPrice && <span className="text-text-weak"> / </span>}
								{tpSlInfo?.slPrice && (
									<span className="text-text-error">{formatPrice(tpSlInfo.slPrice, { szDecimals })}</span>
								)}
							</span>
							<PencilIcon className="size-3 text-text-disabled" />
						</>
					) : (
						<>
							<PlusIcon className="size-3.5 text-text-weak" />
							<span className="text-text-weak">{t`TP/SL`}</span>
						</>
					)}
				</button>

				<button
					type="button"
					onClick={handleLimitClose}
					disabled={!canClose || isClosing}
					className={cn(
						"flex items-center gap-1 text-xs min-h-[36px] px-2 rounded-8 transition-all touch-manipulation",
						"border border-stroke-weak/40 hover:border-fg-400",
						"text-text-weak hover:text-text-strong",
						"active:scale-[0.97] active:bg-bg-raised/50",
						"disabled:opacity-50 disabled:cursor-not-allowed",
					)}
				>
					{t`Limit Close`}
				</button>

				<div className="flex-1" />

				<Button
					variant="outline"
					intent="error"
					size="sm"
					onClick={handleClose}
					disabled={!canClose || isClosing}
					className="min-h-[36px]"
					iconLeft={isRowClosing ? <Spinner className="size-3" /> : <XIcon className="size-3.5" />}
				>
					{t`Close`}
				</Button>
			</div>
		</div>
	);
}

interface MetricCellProps {
	label: string;
	value: string;
	sub?: string;
	valueClass?: string;
}

function MetricCell({ label, value, sub, valueClass }: MetricCellProps) {
	return (
		<div className="px-3 py-2 bg-bg-sunken/50">
			<div className="text-xs text-text-weak mb-0.5">{label}</div>
			<div className={cn("text-xs tabular-nums font-medium", valueClass)}>{value}</div>
			{sub && <div className="text-xs text-text-weak tabular-nums">{sub}</div>}
		</div>
	);
}

export function MobilePositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const closingKeyRef = useRef<string | null>(null);
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const [tpSlModalOpen, setTpSlModalOpen] = useState(false);
	const [selectedTpSlPosition, setSelectedTpSlPosition] = useState<TpSlPositionData | null>(null);
	const [limitCloseModalOpen, setLimitCloseModalOpen] = useState(false);
	const [selectedLimitClosePosition, setSelectedLimitClosePosition] = useState<LimitClosePositionData | null>(null);

	const { mutate: placeOrder, isPending: isClosing, error: closeError, reset: resetCloseError } = useExchange("order");
	const { positions, isLoading: positionsLoading, hasError: positionsError } = useUserPositions();
	const markets = useMarkets();

	const allMidsEnabled = isConnected && positions.length > 0;
	const { data: allMidsEvent } = useSubscription("allMids", { dex: HL_ALL_DEXS }, { enabled: allMidsEnabled });
	const mids = allMidsEvent?.mids;

	const { data: openOrdersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const openOrders = openOrdersEvent?.orders ?? [];

	const tpSlOrdersByCoin = useMemo(() => {
		const map = new Map<string, TpSlOrderInfo>();
		for (const order of openOrders) {
			if (!order.isTrigger) continue;
			const triggerPx = toBig(order.triggerPx)?.toNumber();
			if (!triggerPx || triggerPx <= 0) continue;
			const existing = map.get(order.coin) ?? {};
			if (isTakeProfitOrder(order) && !existing.tpPrice) {
				existing.tpPrice = triggerPx;
				existing.tpOrderId = order.oid;
			} else if (isStopOrder(order) && !existing.slPrice) {
				existing.slPrice = triggerPx;
				existing.slOrderId = order.oid;
			}
			map.set(order.coin, existing);
		}
		return map;
	}, [openOrders]);

	function handleClosePosition(
		assetId: number,
		size: number,
		markPx: number,
		szDecimals: number,
		isLong: boolean,
		coin: string,
	) {
		if (isClosing) return;
		resetCloseError();
		closingKeyRef.current = `${assetId}`;

		const { orders, grouping } = buildOrderPlan({
			kind: "marketClose",
			assetId,
			size,
			szDecimals,
			isLong,
			markPx,
			slippageBps,
		});

		placeOrder(
			{ orders, grouping },
			{
				onSuccess: () => toast.success(t`Position closed` + (coin ? ` — ${coin}` : "")),
				onError: (error) => toast.error(error.message || t`Failed to close position`),
				onSettled: () => {
					closingKeyRef.current = null;
				},
			},
		);
	}

	function handleOpenLimitCloseModal(data: LimitClosePositionData) {
		setSelectedLimitClosePosition(data);
		setLimitCloseModalOpen(true);
	}

	function handleOpenTpSlModal(data: TpSlPositionData) {
		setSelectedTpSlPosition(data);
		setTpSlModalOpen(true);
	}

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;
	const actionError = closeError?.message;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`Connect your wallet to view positions.`}
			</div>
		);
	}

	if (positionsLoading) {
		return <PositionsTabSkeleton />;
	}

	if (positionsError) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-error">
				{t`Failed to load positions.`}
			</div>
		);
	}

	if (positions.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">{t`No active positions.`}</div>
		);
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-weak">
				<ListChecksIcon className="size-3" />
				{t`Active Positions`}
				<span className="font-semibold text-text-success ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError && <div className="px-3 pb-1 text-xs text-text-error">{actionError}</div>}
			<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
				{positions.map((p) => (
					<MobilePositionCard
						key={`${p.coin}-${p.entryPx}-${p.szi}`}
						position={p}
						markets={markets}
						markPx={mids?.[p.coin]}
						tpSlInfo={tpSlOrdersByCoin.get(p.coin)}
						isClosing={isClosing}
						isRowClosing={isClosing && closingKeyRef.current === `${markets.getAssetId(p.coin)}`}
						onClose={handleClosePosition}
						onLimitClose={handleOpenLimitCloseModal}
						onOpenTpSl={handleOpenTpSlModal}
						onSelectMarket={(name) => setSelectedMarket(scope, name)}
					/>
				))}
			</div>

			<PositionTpSlModal open={tpSlModalOpen} onOpenChange={setTpSlModalOpen} position={selectedTpSlPosition} />
			<PositionLimitCloseModal
				open={limitCloseModalOpen}
				onOpenChange={setLimitCloseModalOpen}
				position={selectedLimitClosePosition}
			/>
		</div>
	);
}
