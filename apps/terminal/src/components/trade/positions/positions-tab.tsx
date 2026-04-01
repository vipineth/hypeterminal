import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ListChecksIcon, PencilIcon, PlusIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { PositionActionsDropdown } from "./position-actions-dropdown";
import { PositionLimitCloseModal } from "./position-limit-close-modal";
import { PositionTpSlModal } from "./position-tpsl-modal";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-xs",
				variant === "error" ? "text-text-error" : "text-text-weak",
			)}
		>
			{children}
		</div>
	);
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

interface TpSlOrderInfo {
	tpPrice?: number;
	slPrice?: number;
	tpOrderId?: number;
	slOrderId?: number;
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

interface PositionRowProps {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isClosing: boolean;
	isRowClosing: boolean;
	isEven: boolean;
	onClose: (assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean, coin: string) => void;
	onLimitClose: (data: LimitClosePositionData) => void;
	onReverse: (assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean, coin: string) => void;
	onOpenTpSl: (data: TpSlPositionData) => void;
	onSelectMarket: (coin: string) => void;
}

function PositionRow({
	position: p,
	markets,
	markPx: markPxRaw,
	tpSlInfo,
	isClosing,
	isRowClosing,
	isEven,
	onClose,
	onLimitClose,
	onReverse,
	onOpenTpSl,
	onSelectMarket,
}: PositionRowProps) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const assetId = market?.assetId;
	const szDecimals = market?.szDecimals ?? 4;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const displayName = market?.pairName ?? p.coin;

	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null && Number.isFinite(markPx) && Number.isFinite(liqPx) && Math.abs(liqPx - markPx) / markPx <= 0.1;

	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const roe = toBig(p.returnOnEquity)?.toNumber() ?? Number.NaN;
	const cumFunding = toBig(p.cumFunding.sinceOpen)?.toNumber() ?? Number.NaN;
	const canClose = isPositive(absSize) && typeof assetId === "number" && isPositive(markPx);

	const pnlClass = getValueColorClass(unrealizedPnl);
	const fundingClass = getValueColorClass(cumFunding ? -cumFunding : null);
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
			roe,
			szDecimals,
		});
	}

	function handleReverse() {
		if (!canClose || typeof assetId !== "number") return;
		onReverse(assetId, absSize, markPx, szDecimals, isLong, p.coin);
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
			roe,
			szDecimals,
			existingTpPrice: tpSlInfo?.tpPrice,
			existingSlPrice: tpSlInfo?.slPrice,
			existingTpOrderId: tpSlInfo?.tpOrderId,
			existingSlOrderId: tpSlInfo?.slOrderId,
		});
	}

	return (
		<TableRow className={cn("border-stroke-weak/40 hover:bg-bg-raised/30", isEven && "bg-bg-raised")}>
			<TableCell
				className={cn(
					"text-xs font-medium py-1.5 border-l-2",
					isLong ? "border-l-text-success" : "border-l-text-error",
				)}
			>
				<Button
					variant="link"
					onClick={() => onSelectMarket(p.coin)}
					className="gap-1.5"
					aria-label={t`Switch to ${displayName} market`}
				>
					<AssetDisplay
						coin={p.coin}
						nameClassName="text-xs"
						subtitle={<span className="text-xs text-text-weak uppercase">{isLong ? t`Long` : t`Short`}</span>}
					/>
				</Button>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">
				<div className="flex flex-col items-end">
					<span className="tabular-nums">
						{formatToken(absSize, {
							decimals: szDecimals,
							symbol: p.coin,
						})}
					</span>
					<span className="text-text-weak text-xs">({formatUSD(p.positionValue, { compact: true })})</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-right py-1.5">
				<div className="flex flex-col items-end">
					<span className="tabular-nums">{formatUSD(p.marginUsed)}</span>
					<span className="text-text-weak text-xs">{p.leverage.type === "isolated" ? t`Isolated` : t`Cross`}</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums text-text-weak py-1.5">
				{formatPrice(p.entryPx, { szDecimals })}
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">{formatPrice(markPx, { szDecimals })}</TableCell>
			<TableCell
				className={cn("text-xs text-right tabular-nums py-1.5", liqIsNear ? "text-text-error" : "text-text-weak")}
			>
				{formatPrice(p.liquidationPx, { szDecimals })}
			</TableCell>
			<TableCell className={cn("text-xs text-right tabular-nums py-1.5", fundingClass)}>
				{formatUSD(cumFunding ? -cumFunding : null, { signDisplay: "exceptZero" })}
			</TableCell>
			<TableCell className="text-right py-1.5">
				<div className={cn("text-xs tabular-nums flex flex-col items-end", pnlClass)}>
					<span className="tabular-nums">{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}</span>
					<span className="text-text-weak text-xs">({formatPercent(p.returnOnEquity, 1)})</span>
				</div>
			</TableCell>
			<TableCell className="text-right py-1.5">
				<Tooltip content={tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? t`Edit TP/SL` : t`Add TP/SL`} side="left">
					<button
						type="button"
						onClick={handleOpenTpSl}
						disabled={typeof assetId !== "number"}
						className={cn(
							"group inline-flex items-center gap-1.5 cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
							!hasTpSl && "text-text-disabled hover:text-text-weak",
						)}
					>
						{tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? (
							<>
								<div className="flex items-center gap-1 text-xs tabular-nums">
									<span className="text-text-success">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
									<span className="text-text-weak">/</span>
									<span className="text-text-error">{formatPrice(tpSlInfo.slPrice, { szDecimals })}</span>
								</div>
								<PencilIcon className="size-3 text-text-disabled group-hover:text-text-weak transition-colors" />
							</>
						) : hasTpSl ? (
							<>
								<div className="flex items-center gap-1 text-xs tabular-nums">
									{tpSlInfo?.tpPrice ? (
										<span className="text-text-success">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
									) : (
										<span className="text-text-error">{formatPrice(tpSlInfo?.slPrice, { szDecimals })}</span>
									)}
								</div>
								<PlusIcon className="size-3 text-text-disabled group-hover:text-text-weak transition-colors" />
							</>
						) : (
							<div className="flex items-center gap-0.5 text-xs font-medium text-text-weak">
								<PlusIcon className="size-3 group-hover:text-text-weak transition-colors" />
								<span>{t`Add`}</span>
							</div>
						)}
					</button>
				</Tooltip>
			</TableCell>
			<TableCell className="text-right py-1.5">
				<PositionActionsDropdown
					canClose={canClose}
					isClosing={isClosing}
					isRowClosing={isRowClosing}
					onMarketClose={handleClose}
					onLimitClose={handleLimitClose}
					onReverse={handleReverse}
				/>
			</TableCell>
		</TableRow>
	);
}

export function PositionsTab() {
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

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;
	const actionError = closeError?.message;

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
				onSuccess: () => {
					toast.success(t`Position closed` + (coin ? ` — ${coin}` : ""));
				},
				onError: (error) => {
					toast.error(error.message || t`Failed to close position`);
				},
				onSettled: () => {
					closingKeyRef.current = null;
				},
			},
		);
	}

	function handleReverse(
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
			kind: "reverse",
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
				onSuccess: () => {
					toast.success(t`Position reversed` + (coin ? ` — ${coin}` : ""));
				},
				onError: (error) => {
					toast.error(error.message || t`Failed to reverse position`);
				},
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

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view positions.`}</Placeholder>;
		if (positionsLoading) return <Placeholder>{t`Loading positions...`}</Placeholder>;
		if (positionsError) {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load positions.`}</span>
				</Placeholder>
			);
		}
		if (positions.length === 0) return <Placeholder>{t`No active positions.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-xs uppercase tracking-wider text-text-weak mb-1.5 flex items-center gap-2">
				<ListChecksIcon className="size-3" />
				{t`Active Positions`}
				<span className="font-semibold text-text-success ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError ? <div className="mb-1 text-xs text-text-error">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-stroke-weak/40 rounded-8 bg-bg-sunken/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-stroke-weak/40 bg-bg-raised hover:bg-bg-raised">
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Asset`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Margin`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Entry`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Mark`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Liq`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Funding`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`TP/SL`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{positions.map((p, i) => (
									<PositionRow
										key={`${p.coin}-${p.entryPx}-${p.szi}`}
										position={p}
										markets={markets}
										markPx={mids?.[p.coin]}
										tpSlInfo={tpSlOrdersByCoin.get(p.coin)}
										isClosing={isClosing}
										isRowClosing={isClosing && closingKeyRef.current === `${markets.getAssetId(p.coin)}`}
										isEven={i % 2 === 1}
										onClose={handleClosePosition}
										onLimitClose={handleOpenLimitCloseModal}
										onReverse={handleReverse}
										onOpenTpSl={handleOpenTpSlModal}
										onSelectMarket={(name) => setSelectedMarket(scope, name)}
									/>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
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
