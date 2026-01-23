import { t } from "@lingui/core/macro";
import { Circle, Pencil, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubAssetCtxs, useSubClearinghouseState, useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { calc, isPositive, parseNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import type { PerpAssetCtxs } from "@/types/hyperliquid";
import { TokenAvatar } from "../components/token-avatar";
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
				variant === "error" ? "text-negative/80" : "text-muted-fg",
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

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const closingKeyRef = useRef<string | null>(null);
	const { setSelectedMarket } = useMarketActions();
	const [tpSlModalOpen, setTpSlModalOpen] = useState(false);
	const [selectedTpSlPosition, setSelectedTpSlPosition] = useState<TpSlPositionData | null>(null);

	const { mutate: placeOrder, isPending: isClosing, error: closeError, reset: resetCloseError } = useExchangeOrder();

	const user = address ?? "0x0";
	const clearinghouseEnabled = isConnected && !!address;
	const clearinghouseParams = useMemo(() => ({ user }), [user]);
	const clearinghouseOptions = useMemo(() => ({ enabled: clearinghouseEnabled }), [clearinghouseEnabled]);

	const { data: stateEvent, status, error } = useSubClearinghouseState(clearinghouseParams, clearinghouseOptions);
	const state = stateEvent?.clearinghouseState;

	const positions = useMemo(() => {
		const raw = state?.assetPositions ?? [];
		return raw
			.map((p) => p.position)
			.filter((p) => {
				const size = parseNumber(p.szi);
				return Number.isFinite(size) && size !== 0;
			});
	}, [state]);

	const { getMarket, getAssetId, getSzDecimals } = useMarkets();
	const assetCtxsEnabled = isConnected && positions.length > 0;
	const assetCtxsParams = useMemo(() => ({ dex: "" as const }), []);
	const assetCtxsOptions = useMemo(() => ({ enabled: assetCtxsEnabled }), [assetCtxsEnabled]);
	const { data: assetCtxsEvent } = useSubAssetCtxs(assetCtxsParams, assetCtxsOptions);
	const assetCtxs = assetCtxsEvent?.ctxs as PerpAssetCtxs | undefined;

	const { data: openOrdersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const openOrders = openOrdersEvent?.orders ?? [];

	const tpSlOrdersByCoin = useMemo(() => {
		const map = new Map<string, TpSlOrderInfo>();
		for (const order of openOrders) {
			const orderType = (order as { orderType?: string }).orderType;
			const isTp = orderType === "Take Profit Market" || orderType === "Take Profit Limit";
			const isSl = orderType === "Stop Market" || orderType === "Stop Limit";
			if (!isTp && !isSl) continue;

			const triggerPx = parseNumber((order as { triggerPx?: string }).triggerPx);
			if (!isPositive(triggerPx)) continue;

			const existing = map.get(order.coin) ?? {};
			if (isTp) {
				existing.tpPrice = triggerPx;
				existing.tpOrderId = order.oid;
			} else {
				existing.slPrice = triggerPx;
				existing.slOrderId = order.oid;
			}
			map.set(order.coin, existing);
		}
		return map;
	}, [openOrders]);

	const tableRows = useMemo(() => {
		return positions.map((p) => {
			const size = parseNumber(p.szi);
			const isLong = size > 0;
			const closeSize = Math.abs(size);

			const market = getMarket(p.coin);
			const assetId = getAssetId(p.coin);
			const szDecimals = getSzDecimals(p.coin) ?? 4;
			const markPxRaw = typeof assetId === "number" ? assetCtxs?.[assetId]?.markPx : undefined;
			const markPx = markPxRaw ? parseNumber(markPxRaw) : Number.NaN;
			const entryPx = parseNumber(p.entryPx);
			const unrealizedPnl = parseNumber(p.unrealizedPnl);
			const roe = parseNumber(p.returnOnEquity);
			const cumFunding = parseNumber((p as { cumFunding?: { sinceOpen?: string } }).cumFunding?.sinceOpen);
			const leverageType = (p as { leverage?: { type?: string } }).leverage?.type as "cross" | "isolated" | undefined;

			const canClose = isPositive(closeSize) && typeof assetId === "number" && isPositive(markPx);
			const tpSlInfo = tpSlOrdersByCoin.get(p.coin);
			const maxLeverage = market && market.kind !== "spot" ? market.maxLeverage : undefined;

			return {
				key: `${p.coin}-${p.entryPx}-${p.szi}`,
				coin: p.coin,
				isLong,
				closeSize,
				assetId,
				markPx,
				szDecimals,
				maxLeverage,
				canClose,
				entryPx,
				unrealizedPnl,
				roe,
				size: Math.abs(size),
				positionValue: p.positionValue,
				liquidationPx: p.liquidationPx,
				marginUsed: (p as { marginUsed?: string }).marginUsed,
				marginMode: leverageType ?? "cross",
				cumFunding,
				tpPrice: tpSlInfo?.tpPrice,
				slPrice: tpSlInfo?.slPrice,
				tpOrderId: tpSlInfo?.tpOrderId,
				slOrderId: tpSlInfo?.slOrderId,
				hasTpSl: !!(tpSlInfo?.tpPrice || tpSlInfo?.slPrice),
			};
		});
	}, [positions, getMarket, getAssetId, getSzDecimals, assetCtxs, tpSlOrdersByCoin]);

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;

	const handleClosePosition = (row: (typeof tableRows)[number]) => {
		if (isClosing || !row.canClose) return;

		const assetId = row.assetId;
		if (typeof assetId !== "number" || !Number.isFinite(row.markPx)) return;

		resetCloseError();
		closingKeyRef.current = row.key;

		const isBuy = !row.isLong;
		const orderPrice = calc.applySlippage(row.markPx, slippageBps, isBuy) ?? row.markPx;

		placeOrder(
			{
				orders: [
					{
						a: assetId,
						b: isBuy,
						p: formatPriceForOrder(orderPrice),
						s: formatSizeForOrder(row.closeSize, row.szDecimals),
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
	};

	const actionError = closeError?.message;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view positions.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading positions...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load positions.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-muted-fg">{error.message}</span>}
				</Placeholder>
			);
		}
		if (positions.length === 0) return <Placeholder>{t`No active positions.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	function handleOpenTpSlModal(row: (typeof tableRows)[number]) {
		if (typeof row.assetId !== "number") return;
		setSelectedTpSlPosition({
			coin: row.coin,
			assetId: row.assetId,
			isLong: row.isLong,
			size: row.closeSize,
			entryPx: row.entryPx,
			markPx: row.markPx,
			unrealizedPnl: row.unrealizedPnl,
			roe: row.roe,
			szDecimals: row.szDecimals,
			existingTpPrice: row.tpPrice,
			existingSlPrice: row.slPrice,
			existingTpOrderId: row.tpOrderId,
			existingSlOrderId: row.slOrderId,
		});
		setTpSlModalOpen(true);
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-fg mb-1.5 flex items-center gap-2">
				<Circle className="size-1.5 fill-positive text-positive" />
				{t`Active Positions`}
				<span className="text-info ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-negative/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-bg/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Margin`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Entry`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Mark`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Liq`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Funding`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`TP/SL`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => {
									const isRowClosing = isClosing && closingKeyRef.current === row.key;
									const sideClass = row.isLong ? "bg-positive/20 text-positive" : "bg-negative/20 text-negative";
									const pnlClass = row.unrealizedPnl >= 0 ? "text-positive" : "text-negative";
									const fundingClass = row.cumFunding >= 0 ? "text-negative" : "text-positive";

									return (
										<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideClass)}>
														{row.isLong ? t`Long` : t`Short`}
													</span>
													<Button
														variant="link"
														size="none"
														onClick={() => setSelectedMarket(row.coin)}
														className="gap-1.5"
														aria-label={t`Switch to ${row.coin} market`}
													>
														<TokenAvatar symbol={row.coin} />
														<span>{row.coin}</span>
													</Button>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatToken(row.size, row.szDecimals)}{" "}
												<span className="text-muted-fg">({formatUSD(row.positionValue, { compact: true })})</span>
											</TableCell>
											<TableCell className="text-2xs text-right py-1.5">
												<div className="flex flex-col items-end">
													<span className="tabular-nums">{formatUSD(row.marginUsed)}</span>
													<span className="text-4xs text-muted-fg">
														{row.marginMode === "isolated" ? t`Isolated` : t`Cross`}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatPrice(row.entryPx, { szDecimals: row.szDecimals })}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-warning py-1.5">
												{formatPrice(row.markPx, { szDecimals: row.szDecimals })}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-negative/70 py-1.5">
												{formatPrice(row.liquidationPx, { szDecimals: row.szDecimals })}
											</TableCell>
											<TableCell className={cn("text-2xs text-right tabular-nums py-1.5", fundingClass)}>
												{formatUSD(row.cumFunding ? -row.cumFunding : null, { signDisplay: "exceptZero" })}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<div className={cn("text-2xs tabular-nums", pnlClass)}>
													{formatUSD(row.unrealizedPnl, { signDisplay: "exceptZero" })}
													<span className="text-muted-fg ml-1">({formatPercent(row.roe, 1)})</span>
												</div>
											</TableCell>
											<TableCell className="text-right py-1.5">
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => handleOpenTpSlModal(row)}
															disabled={typeof row.assetId !== "number"}
															className={cn(
																"group inline-flex items-center gap-1.5 cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
																!row.hasTpSl && "text-muted-fg/60 hover:text-muted-fg",
															)}
														>
															{row.tpPrice && row.slPrice ? (
																<>
																	<div className="flex items-center gap-1 text-3xs tabular-nums">
																		<span className="text-positive">
																			{formatPrice(row.tpPrice, { szDecimals: row.szDecimals })}
																		</span>
																		<span className="text-muted-fg/50">/</span>
																		<span className="text-negative">
																			{formatPrice(row.slPrice, { szDecimals: row.szDecimals })}
																		</span>
																	</div>
																	<Pencil className="size-3 text-muted-fg/60 group-hover:text-fg transition-colors" />
																</>
															) : row.hasTpSl ? (
																<>
																	<div className="flex items-center gap-1 text-3xs tabular-nums">
																		{row.tpPrice ? (
																			<span className="text-positive">
																				{formatPrice(row.tpPrice, { szDecimals: row.szDecimals })}
																			</span>
																		) : (
																			<span className="text-negative">
																				{formatPrice(row.slPrice, { szDecimals: row.szDecimals })}
																			</span>
																		)}
																	</div>
																	<Plus className="size-3 text-muted-fg/60 group-hover:text-fg transition-colors" />
																</>
															) : (
																<div className="flex items-center gap-0.5 text-3xs">
																	<Plus className="size-3 group-hover:text-fg transition-colors" />
																	<span>{t`Add`}</span>
																</div>
															)}
														</button>
													</TooltipTrigger>
													<TooltipContent side="left">
														{row.tpPrice && row.slPrice ? t`Edit TP/SL` : t`Add TP/SL`}
													</TooltipContent>
												</Tooltip>
											</TableCell>
											<TableCell className="text-right py-1.5">
												<TradingActionButton
													variant="danger"
													size="xs"
													aria-label={t`Close position`}
													onClick={() => handleClosePosition(row)}
													disabled={!row.canClose || isClosing}
												>
													{isRowClosing ? t`Closing...` : t`Close`}
												</TradingActionButton>
											</TableCell>
										</TableRow>
									);
								})}
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
