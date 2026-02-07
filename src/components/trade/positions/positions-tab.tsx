import { t } from "@lingui/core/macro";
import { CircleIcon, PencilIcon, PlusIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/constants";
import { getExecutedPrice } from "@/domain/trade/order/price";
import { formatPriceForOrder, formatSizeForOrder } from "@/domain/trade/orders";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useUserPositions } from "@/lib/hyperliquid";
import type { Position } from "@/lib/hyperliquid/account/use-user-positions";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubAllMids, useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import type { Markets } from "@/lib/hyperliquid/markets";
import { getValueColorClass, isPositive, toBig } from "@/lib/trade/numbers";
import { isStopOrder, isTakeProfitOrder } from "@/lib/trade/open-orders";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";
import { TradingActionButton } from "../components/trading-action-button";
import { PositionTpSlModal } from "./position-tpsl-modal";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-market-down-primary/80" : "text-fg-700",
			)}
		>
			{children}
		</div>
	);
}

interface TpSlPositionData {
	coin: string;
	displayName: string;
	iconUrl: string | undefined;
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

interface PositionRowProps {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	tpSlInfo: TpSlOrderInfo | undefined;
	isClosing: boolean;
	isRowClosing: boolean;
	isEven: boolean;
	onClose: (assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean) => void;
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
	const displayName = market?.displayName ?? p.coin;
	const assetInfo = market ?? { displayName: p.coin, iconUrl: undefined };

	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const cumFunding = toBig(p.cumFunding.sinceOpen)?.toNumber() ?? Number.NaN;
	const canClose = isPositive(absSize) && typeof assetId === "number" && isPositive(markPx);

	const sideClass = isLong
		? "bg-market-up-subtle text-market-up-primary"
		: "bg-market-down-subtle text-market-down-primary";
	const pnlClass = unrealizedPnl >= 0 ? "text-market-up-muted" : "text-market-down-primary";
	const fundingClass = getValueColorClass(cumFunding ? -cumFunding : null);
	const hasTpSl = !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice);

	function handleClose() {
		if (!canClose || typeof assetId !== "number") return;
		onClose(assetId, absSize, markPx, szDecimals, isLong);
	}

	function handleOpenTpSl() {
		if (typeof assetId !== "number") return;
		onOpenTpSl({
			coin: p.coin,
			displayName,
			iconUrl: assetInfo.iconUrl,
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
		<TableRow className={cn("border-border/40 hover:bg-surface-500/30", isEven && "bg-surface-alt")}>
			<TableCell className="text-3xs font-medium py-1.5">
				<div className="flex items-center gap-1.5">
					<Button
						variant="text"
						size="none"
						onClick={() => onSelectMarket(p.coin)}
						className="gap-1.5"
						aria-label={t`Switch to ${displayName} market`}
					>
						<AssetDisplay asset={assetInfo} />
					</Button>
					<span className={cn("text-5xs font-bold px-1 py-0.5 rounded-sm uppercase", sideClass)}>
						{isLong ? t`Long` : t`Short`}
					</span>
				</div>
			</TableCell>
			<TableCell className="text-3xs text-right tabular-nums py-1.5">
				{formatToken(absSize, szDecimals)}{" "}
				<span className="text-fg-700">({formatUSD(p.positionValue, { compact: true })})</span>
			</TableCell>
			<TableCell className="text-3xs text-right py-1.5">
				<div className="flex flex-col items-end">
					<span className="tabular-nums">{formatUSD(p.marginUsed)}</span>
					<span className="text-3xs text-fg-500">{p.leverage.type === "isolated" ? t`Isolated` : t`Cross`}</span>
				</div>
			</TableCell>
			<TableCell className="text-3xs text-right tabular-nums text-fg-500 py-1.5">
				{formatPrice(p.entryPx, { szDecimals })}
			</TableCell>
			<TableCell className="text-3xs text-right tabular-nums py-1.5">{formatPrice(markPx, { szDecimals })}</TableCell>
			<TableCell className="text-3xs text-right tabular-nums text-market-down-primary py-1.5">
				{formatPrice(p.liquidationPx, { szDecimals })}
			</TableCell>
			<TableCell className={cn("text-3xs text-right tabular-nums py-1.5", fundingClass)}>
				{formatUSD(cumFunding ? -cumFunding : null, { signDisplay: "exceptZero" })}
			</TableCell>
			<TableCell className="text-right py-1.5">
				<div className={cn("text-3xs tabular-nums", pnlClass)}>
					{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					<span className="text-fg-500 ml-1">({formatPercent(p.returnOnEquity, 1)})</span>
				</div>
			</TableCell>
			<TableCell className="text-right py-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={handleOpenTpSl}
							disabled={typeof assetId !== "number"}
							className={cn(
								"group inline-flex items-center gap-1.5 cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
								!hasTpSl && "text-fg-400 hover:text-fg-700",
							)}
						>
							{tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? (
								<>
									<div className="flex items-center gap-1 text-3xs tabular-nums">
										<span className="text-market-up-primary">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
										<span className="text-fg-700/50">/</span>
										<span className="text-market-down-primary">{formatPrice(tpSlInfo.slPrice, { szDecimals })}</span>
									</div>
									<PencilIcon className="size-3 text-fg-400 group-hover:text-fg-900 transition-colors" />
								</>
							) : hasTpSl ? (
								<>
									<div className="flex items-center gap-1 text-3xs tabular-nums">
										{tpSlInfo?.tpPrice ? (
											<span className="text-market-up-primary">{formatPrice(tpSlInfo.tpPrice, { szDecimals })}</span>
										) : (
											<span className="text-market-down-primary">{formatPrice(tpSlInfo?.slPrice, { szDecimals })}</span>
										)}
									</div>
									<PlusIcon className="size-3 text-fg-400 group-hover:text-fg-900 transition-colors" />
								</>
							) : (
								<div className="flex items-center gap-0.5 text-xs font-medium text-fg-700">
									<PlusIcon className="size-3 group-hover:text-fg-900 transition-colors" />
									<span>{t`Add`}</span>
								</div>
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent side="left">
						{tpSlInfo?.tpPrice && tpSlInfo?.slPrice ? t`Edit TP/SL` : t`Add TP/SL`}
					</TooltipContent>
				</Tooltip>
			</TableCell>
			<TableCell className="text-right py-1.5">
				<TradingActionButton
					variant="text"
					size="sm"
					aria-label={t`Close position`}
					onClick={handleClose}
					disabled={!canClose || isClosing}
				>
					{isRowClosing ? t`Closing...` : t`Close`}
				</TradingActionButton>
			</TableCell>
		</TableRow>
	);
}

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const closingKeyRef = useRef<string | null>(null);
	const { setSelectedMarket } = useMarketActions();
	const [tpSlModalOpen, setTpSlModalOpen] = useState(false);
	const [selectedTpSlPosition, setSelectedTpSlPosition] = useState<TpSlPositionData | null>(null);

	const { mutate: placeOrder, isPending: isClosing, error: closeError, reset: resetCloseError } = useExchangeOrder();

	const { positions, isLoading: positionsLoading, hasError: positionsError } = useUserPositions();

	const markets = useMarkets();
	const allMidsEnabled = isConnected && positions.length > 0;
	const { data: allMidsEvent } = useSubAllMids({ dex: HL_ALL_DEXS }, { enabled: allMidsEnabled });
	const mids = allMidsEvent?.mids;

	const { data: openOrdersEvent } = useSubOpenOrders(
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

	function handleClosePosition(assetId: number, size: number, markPx: number, szDecimals: number, isLong: boolean) {
		if (isClosing) return;

		resetCloseError();
		closingKeyRef.current = `${assetId}`;

		const side = isLong ? "sell" : "buy";
		const orderPrice = getExecutedPrice("market", side, markPx, slippageBps, markPx);

		placeOrder(
			{
				orders: [
					{
						a: assetId,
						b: side === "buy",
						p: formatPriceForOrder(orderPrice),
						s: formatSizeForOrder(size, szDecimals),
						r: true,
						t: { limit: { tif: "FrontendMarket" as const } },
					},
				],
				grouping: "na",
			},
			{
				onSettled: () => {
					closingKeyRef.current = null;
				},
			},
		);
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
			<div className="text-3xs tracking-wider text-fg-900 mb-1.5 flex items-center gap-2">
				<CircleIcon weight="fill" className="size-1.5 text-market-up-primary" />
				{t`Active Positions`}
				<span className="font-semibold text-market-up-primary ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-market-down-primary/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-surface-200/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 bg-surface-alt hover:bg-surface-alt">
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Margin`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Entry`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Mark`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Liq`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`Funding`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
										{t`TP/SL`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-fg-500 text-right h-7">
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
										onOpenTpSl={handleOpenTpSlModal}
										onSelectMarket={setSelectedMarket}
									/>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>

			<PositionTpSlModal open={tpSlModalOpen} onOpenChange={setTpSlModalOpen} position={selectedTpSlPosition} />
		</div>
	);
}
