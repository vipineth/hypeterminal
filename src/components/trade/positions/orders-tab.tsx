import { t } from "@lingui/core/macro";
import { ListOrdered } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTime, formatNumber, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useExchangeCancel } from "@/lib/hyperliquid/hooks/exchange/useExchangeCancel";
import { useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import {
	getFilledSize,
	getFillPercent,
	getOrderTypeConfig,
	getOrderValue,
	getSideConfig,
	type OpenOrder,
} from "@/lib/trade/open-orders";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";
import { TokenAvatar } from "../components/token-avatar";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-terminal-red/80" : "text-muted-foreground",
			)}
		>
			{children}
		</div>
	);
}

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

	const openOrders = openOrdersEvent?.orders ?? [];
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
		(ordersToCancel: OpenOrder[]) => {
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

	const canCancel = !isCancelling;
	const disableCancelSelected = !canCancel || selectedCount === 0;
	const disableCancelAll = !canCancel || openOrders.length === 0;
	const actionError = cancelError?.message;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view open orders.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading open orders...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load open orders.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>}
				</Placeholder>
			);
		}
		if (openOrders.length === 0) return <Placeholder>{t`No open orders.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<ListOrdered className="size-3" />
				{t`Open Orders`}
				<div className="ml-auto flex items-center gap-2">
					<span className="text-terminal-cyan tabular-nums">{headerCount}</span>
					<Button
						variant="danger"
						size="xs"
						aria-label={t`Cancel selected orders`}
						onClick={handleCancelSelected}
						disabled={disableCancelSelected}
					>
						{isCancelling ? t`Canceling...` : t`Cancel selected`}
					</Button>
					<Button
						variant="danger"
						size="xs"
						aria-label={t`Cancel all orders`}
						onClick={handleCancelAll}
						disabled={disableCancelAll}
					>
						{isCancelling ? t`Canceling...` : t`Cancel all`}
					</Button>
				</div>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-terminal-red/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{placeholder ?? (
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
										/>
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Time`}
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
										{t`Trigger`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Reduce`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{openOrders.map((order) => (
									<OrderRow
										key={order.oid}
										order={order}
										szDecimals={getSzDecimals(order.coin) ?? 4}
										isSelected={selectedOrderIds.has(order.oid)}
										isCancelling={isCancelling}
										canCancel={canCancel}
										onToggle={handleToggleOrder}
										onCancel={handleCancelOrders}
										onSelectMarket={setSelectedMarketKey}
									/>
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

interface OrderRowProps {
	order: OpenOrder;
	szDecimals: number;
	isSelected: boolean;
	isCancelling: boolean;
	canCancel: boolean;
	onToggle: (orderId: number, value: boolean | "indeterminate") => void;
	onCancel: (orders: OpenOrder[]) => void;
	onSelectMarket: (marketKey: string) => void;
}

function OrderRow({
	order,
	szDecimals,
	isSelected,
	isCancelling,
	canCancel,
	onToggle,
	onCancel,
	onSelectMarket,
}: OrderRowProps) {
	const fillPct = getFillPercent(order);
	const sideConfig = getSideConfig(order);
	const typeConfig = getOrderTypeConfig(order);

	return (
		<TableRow className="border-border/40 hover:bg-accent/30">
			<TableCell className="py-1.5">
				<Checkbox
					checked={isSelected}
					onCheckedChange={(value) => onToggle(order.oid, value)}
					aria-label={`${t`Select order`} ${order.coin}`}
					disabled={isCancelling}
				/>
			</TableCell>
			<TableCell className="text-2xs text-muted-foreground py-1.5 whitespace-nowrap">
				{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
			</TableCell>
			<TableCell className="text-2xs font-medium py-1.5">
				<div className="flex items-center gap-1.5">
					<Button
						variant="link"
						size="none"
						onClick={() => onSelectMarket(makePerpMarketKey(order.coin))}
						className="gap-1.5"
						aria-label={t`Switch to ${order.coin} market`}
					>
						<TokenAvatar symbol={order.coin} />
						<span>{order.coin}</span>
					</Button>
					<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideConfig.class)}>{sideConfig.label}</span>
				</div>
			</TableCell>
			<TableCell className="text-2xs py-1.5">
				<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", typeConfig.class)}>{typeConfig.label}</span>
			</TableCell>
			<TableCell className="text-2xs text-right tabular-nums py-1.5">
				{formatUSD(order.limitPx, { compact: false })}
			</TableCell>
			<TableCell className="text-2xs text-right tabular-nums py-1.5">
				{formatNumber(order.origSz, szDecimals)} {order.coin}{" "}
				<span className="text-muted-foreground">({formatUSD(getOrderValue(order), { compact: false })})</span>
			</TableCell>
			<TableCell className="text-2xs text-right tabular-nums py-1.5">
				<span className={cn(fillPct > 0 && "text-terminal-amber")}>
					{formatNumber(getFilledSize(order), szDecimals)} ({fillPct.toFixed(0)}%)
				</span>
			</TableCell>
			<TableCell className="text-2xs text-muted-foreground py-1.5">
				{order.triggerCondition || FALLBACK_VALUE_PLACEHOLDER}
			</TableCell>
			<TableCell className="text-2xs py-1.5">
				{order.reduceOnly ? (
					<span className="text-terminal-cyan">{t`Yes`}</span>
				) : (
					<span className="text-muted-foreground">{t`No`}</span>
				)}
			</TableCell>
			<TableCell className="text-right py-1.5">
				<Button
					variant="danger"
					size="xs"
					aria-label={t`Cancel order`}
					onClick={() => onCancel([order])}
					disabled={!canCancel}
				>
					{isCancelling ? t`Canceling...` : t`Cancel`}
				</Button>
			</TableCell>
		</TableRow>
	);
}
