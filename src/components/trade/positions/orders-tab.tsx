import { t } from "@lingui/core/macro";
import { ListOrdered } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/constants/app";
import { formatNumber, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useExchangeCancel } from "@/lib/hyperliquid/hooks/exchange/useExchangeCancel";
import { useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { TokenAvatar } from "../components/token-avatar";

export function OrdersTab() {
	const { address, isConnected } = useConnection();
	const { setSelectedMarketKey } = useMarketPrefsActions();
	const {
		data: openOrdersEvent,
		status,
		error,
	} = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const { getSzDecimals, getAssetId } = usePerpMarkets();
	const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(() => new Set());

	const {
		mutate: cancelOrders,
		isPending: isCancelling,
		error: cancelError,
		reset: resetCancelError,
	} = useExchangeCancel();

	const openOrders = useMemo(() => openOrdersEvent?.orders ?? [], [openOrdersEvent?.orders]);
	const headerCount = isConnected ? openOrders.length : FALLBACK_VALUE_PLACEHOLDER;

	useEffect(() => {
		if (selectedOrderIds.size === 0) return;
		const openIds = new Set(openOrders.map((order) => order.oid));
		let changed = false;
		for (const id of selectedOrderIds) {
			if (!openIds.has(id)) {
				changed = true;
				break;
			}
		}
		if (!changed) return;

		setSelectedOrderIds((prev) => {
			const next = new Set<number>();
			for (const id of prev) {
				if (openIds.has(id)) {
					next.add(id);
				}
			}
			return next;
		});
	}, [openOrders, selectedOrderIds]);

	const selectedCount = selectedOrderIds.size;
	const allSelected = selectedCount > 0 && selectedCount === openOrders.length;
	const someSelected = selectedCount > 0 && selectedCount < openOrders.length;

	const handleToggleAll = useCallback(
		(value: boolean | "indeterminate") => {
			if (value === true) {
				setSelectedOrderIds(new Set(openOrders.map((order) => order.oid)));
			} else {
				setSelectedOrderIds(new Set());
			}
		},
		[openOrders],
	);

	const handleToggleOrder = useCallback((orderId: number, value: boolean | "indeterminate") => {
		setSelectedOrderIds((prev) => {
			const next = new Set(prev);
			if (value === true) {
				next.add(orderId);
			} else {
				next.delete(orderId);
			}
			return next;
		});
	}, []);

	const handleCancelOrders = useCallback(
		(ordersToCancel: typeof openOrders) => {
			if (isCancelling || ordersToCancel.length === 0) return;

			const cancels = ordersToCancel.reduce<{ a: number; o: number }[]>((acc, order) => {
				const assetIndex = getAssetId(order.coin);
				if (typeof assetIndex !== "number") return acc;
				acc.push({ a: assetIndex, o: order.oid });
				return acc;
			}, []);

			if (cancels.length === 0) return;

			resetCancelError();
			cancelOrders(
				{ cancels },
				{
					onSuccess: () => {
						setSelectedOrderIds((prev) => {
							const next = new Set(prev);
							for (const order of ordersToCancel) {
								next.delete(order.oid);
							}
							return next;
						});
					},
				},
			);
		},
		[isCancelling, getAssetId, cancelOrders, resetCancelError],
	);

	const handleCancelSelected = useCallback(() => {
		const ordersToCancel = openOrders.filter((order) => selectedOrderIds.has(order.oid));
		handleCancelOrders(ordersToCancel);
	}, [handleCancelOrders, openOrders, selectedOrderIds]);

	const handleCancelAll = useCallback(() => {
		handleCancelOrders(openOrders);
	}, [handleCancelOrders, openOrders]);

	const orderRows = useMemo(() => {
		return openOrders.map((order) => {
			const isBuy = order.side === "B";
			const origSz = parseNumber(order.origSz);
			const remaining = parseNumber(order.sz);
			const filled =
				Number.isFinite(origSz) && Number.isFinite(remaining) ? Math.max(0, origSz - remaining) : Number.NaN;
			const fillPct = Number.isFinite(origSz) && origSz !== 0 && Number.isFinite(filled) ? (filled / origSz) * 100 : 0;
			const limitPx = parseNumber(order.limitPx);
			const szDecimals = getSzDecimals(order.coin) ?? 4;

			return {
				key: order.oid,
				order,
				coin: order.coin,
				sideLabel: isBuy ? t`buy` : t`sell`,
				sideClass: isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				typeLabel: order.reduceOnly ? t`limit ro` : t`limit`,
				priceText: Number.isFinite(limitPx) ? formatUSD(limitPx, { compact: false }) : String(order.limitPx),
				sizeText: Number.isFinite(origSz) ? formatNumber(origSz, szDecimals) : String(order.origSz),
				filledText: Number.isFinite(filled) ? formatNumber(filled, szDecimals) : FALLBACK_VALUE_PLACEHOLDER,
				hasFilled: Number.isFinite(filled) && filled > 0,
				fillPctText: `${fillPct.toFixed(0)}%`,
				statusLabel: t`open`,
			};
		});
	}, [openOrders, getSzDecimals]);

	const canCancel = !isCancelling;
	const disableCancelSelected = !canCancel || selectedCount === 0;
	const disableCancelAll = !canCancel || openOrders.length === 0;
	const actionError = cancelError?.message;

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<ListOrdered className="size-3" />
				{t`Open Orders`}
				<div className="ml-auto flex items-center gap-2">
					<span className="text-terminal-cyan tabular-nums">{headerCount}</span>
					<button
						type="button"
						className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						tabIndex={0}
						aria-label={t`Cancel selected orders`}
						onClick={handleCancelSelected}
						disabled={disableCancelSelected}
					>
						{isCancelling ? t`Canceling...` : t`Cancel selected`}
					</button>
					<button
						type="button"
						className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						tabIndex={0}
						aria-label={t`Cancel all orders`}
						onClick={handleCancelAll}
						disabled={disableCancelAll}
					>
						{isCancelling ? t`Canceling...` : t`Cancel all`}
					</button>
				</div>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-terminal-red/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view open orders.`}
					</div>
				) : status === "subscribing" || status === "idle" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading open orders...`}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load open orders.`}</span>
						{error instanceof Error ? (
							<span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>
						) : null}
					</div>
				) : openOrders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No open orders.`}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="w-7">
										<Checkbox
											checked={allSelected ? true : someSelected ? "indeterminate" : false}
											onCheckedChange={handleToggleAll}
											aria-label={t`Select all orders`}
											disabled={openOrders.length === 0 || isCancelling}
											className="size-3.5 border-border/70 bg-background/60 data-[state=checked]:bg-terminal-cyan data-[state=checked]:border-terminal-cyan data-[state=checked]:text-background"
										/>
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Type`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Filled`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Status`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orderRows.map((row) => (
									<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
										<TableCell className="py-1.5">
											<Checkbox
												checked={selectedOrderIds.has(row.order.oid)}
												onCheckedChange={(value) => handleToggleOrder(row.order.oid, value)}
												aria-label={`${t`Select order`} ${row.coin}`}
												disabled={isCancelling}
												className="size-3.5 border-border/70 bg-background/60 data-[state=checked]:bg-terminal-cyan data-[state=checked]:border-terminal-cyan data-[state=checked]:text-background"
											/>
										</TableCell>
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
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
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{row.typeLabel}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.priceText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.sizeText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(row.hasFilled && "text-terminal-amber")}>
												{row.filledText} ({row.fillPctText})
											</span>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-terminal-cyan/20 text-terminal-cyan">
												{row.statusLabel}
											</span>
										</TableCell>
										<TableCell className="text-right py-1.5">
											<button
												type="button"
												className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												tabIndex={0}
												aria-label={t`Cancel order`}
												onClick={() => handleCancelOrders([row.order])}
												disabled={!canCancel}
											>
												{isCancelling ? t`Canceling...` : t`Cancel`}
											</button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
