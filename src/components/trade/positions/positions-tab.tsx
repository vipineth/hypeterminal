import { t } from "@lingui/core/macro";
import clsx from "clsx";
import { Circle } from "lucide-react";
import { useMemo, useRef } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubAssetCtxs, useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import { parseNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { useMarketOrderSlippageBps } from "@/stores/use-trade-settings-store";
import type { PerpAssetCtxs } from "@/types/hyperliquid";
import { TokenAvatar } from "../components/token-avatar";

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const closingKeyRef = useRef<string | null>(null);
	const { setSelectedMarketKey } = useMarketPrefsActions();

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

	const { getSzDecimals, getAssetId } = usePerpMarkets();
	const assetCtxsEnabled = isConnected && positions.length > 0;
	const assetCtxsParams = useMemo(() => ({ dex: "" as const }), []);
	const assetCtxsOptions = useMemo(() => ({ enabled: assetCtxsEnabled }), [assetCtxsEnabled]);
	const { data: assetCtxsEvent } = useSubAssetCtxs(assetCtxsParams, assetCtxsOptions);
	const assetCtxs = assetCtxsEvent?.ctxs as PerpAssetCtxs | undefined;

	const tableRows = useMemo(() => {
		return positions.map((p) => {
			const size = parseNumber(p.szi);
			const isLong = size > 0;
			const closeSize = Math.abs(size);

			const entryPx = parseNumber(p.entryPx);
			const positionValue = parseNumber(p.positionValue);
			const unrealizedPnl = parseNumber(p.unrealizedPnl);
			const roe = parseNumber(p.returnOnEquity);
			const liquidationPx = p.liquidationPx ? parseNumber(p.liquidationPx) : Number.NaN;

			const szDecimals = getSzDecimals(p.coin) ?? 4;
			const assetIndex = getAssetId(p.coin);
			const markPxRaw = typeof assetIndex === "number" ? assetCtxs?.[assetIndex]?.markPx : undefined;
			const markPx = markPxRaw ? parseNumber(markPxRaw) : Number.NaN;

			const canClose =
				Number.isFinite(closeSize) &&
				closeSize > 0 &&
				typeof assetIndex === "number" &&
				Number.isFinite(markPx) &&
				markPx > 0;

			return {
				key: `${p.coin}-${p.entryPx}-${p.szi}`,
				coin: p.coin,
				isLong,
				closeSize,
				assetIndex,
				markPx,
				szDecimals,
				canClose,
				sideLabel: isLong ? t`Long` : t`Short`,
				sideClass: isLong ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				sizeText: Number.isFinite(size) ? formatToken(Math.abs(size), szDecimals) : FALLBACK_VALUE_PLACEHOLDER,
				valueText: Number.isFinite(positionValue)
					? formatUSD(Math.abs(positionValue), { compact: true })
					: FALLBACK_VALUE_PLACEHOLDER,
				entryText: Number.isFinite(entryPx) ? formatPrice(entryPx, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				markText: Number.isFinite(markPx) ? formatPrice(markPx, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				liqText: Number.isFinite(liquidationPx)
					? formatPrice(liquidationPx, { szDecimals })
					: FALLBACK_VALUE_PLACEHOLDER,
				pnlText: Number.isFinite(unrealizedPnl)
					? formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })
					: FALLBACK_VALUE_PLACEHOLDER,
				roeText: Number.isFinite(roe) ? formatPercent(roe, 1) : FALLBACK_VALUE_PLACEHOLDER,
				pnlClass: unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
			};
		});
	}, [positions, getSzDecimals, getAssetId, assetCtxs]);

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;

	const handleClosePosition = (row: (typeof tableRows)[number]) => {
		if (isClosing || !row.canClose) return;

		const assetIndex = row.assetIndex;
		if (typeof assetIndex !== "number" || !Number.isFinite(row.markPx)) return;

		resetCloseError();
		closingKeyRef.current = row.key;

		const isBuy = !row.isLong;
		const slippage = slippageBps / 10000;
		const orderPrice = isBuy ? row.markPx * (1 + slippage) : row.markPx * (1 - slippage);

		placeOrder(
			{
				orders: [
					{
						a: assetIndex,
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

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Circle className="size-1.5 fill-terminal-green text-terminal-green" />
				{t`Active Positions`}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-terminal-red/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view positions.`}
					</div>
				) : status === "subscribing" || status === "idle" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading positions...`}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load positions.`}</span>
						{error instanceof Error ? (
							<span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>
						) : null}
					</div>
				) : positions.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No active positions.`}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Value`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Entry`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Mark`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Liq`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => {
									const isRowClosing = isClosing && closingKeyRef.current === row.key;
									return (
										<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={clsx("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
														{row.sideLabel}
													</span>
													<button
														type="button"
														onClick={() => setSelectedMarketKey(makePerpMarketKey(row.coin))}
														className="flex items-center gap-1.5 hover:underline hover:text-terminal-cyan transition-colors"
														aria-label={t`Switch to ${row.coin} market`}
													>
														<TokenAvatar symbol={row.coin} />
														<span>{row.coin}</span>
													</button>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.sizeText}</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.valueText}</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.entryText}</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
												{row.markText}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<div className={clsx("text-2xs tabular-nums", row.pnlClass)}>
													{row.pnlText}
													<span className="text-muted-foreground ml-1">({row.roeText})</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-terminal-red/70 py-1.5">
												{row.liqText}
											</TableCell>
											<TableCell className="text-right py-1.5">
												<div className="flex justify-end gap-1">
													<button
														type="button"
														className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														tabIndex={0}
														aria-label={t`Close position`}
														onClick={() => handleClosePosition(row)}
														disabled={!row.canClose || isClosing}
													>
														{isRowClosing ? t`Closing...` : t`Close`}
													</button>
													<button
														type="button"
														className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/60 hover:text-terminal-cyan transition-colors"
														tabIndex={0}
														aria-label={t`Set TP/SL`}
													>
														{t`TP/SL`}
													</button>
												</div>
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
		</div>
	);
}
