import {
	Button,
	Checkbox,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { useState } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/app";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useExchange, useMarkets, useSubscription } from "@/lib/hyperliquid";
import {
	getOrderTypeConfig,
	getOrderValue,
	isClosePositionOrder,
	isMarketTriggerOrder,
	type OpenOrder,
} from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { AssetBadge } from "../components/asset-badge";
import { Placeholder } from "./placeholder";
import {
	positionsPanelRowHoverClass,
	positionsPanelRowStripeClass,
	positionsPanelTableBodyClass,
	positionsPanelTableCaptionRowClass,
	positionsPanelTableCellClass,
	positionsPanelTableHeadClass,
	positionsPanelTableHeaderClass,
	positionsPanelTableHeaderRowClass,
	positionsPanelTableShellClass,
	positionsPanelTabRootClass,
} from "./positions-panel-table-styles";

type CancelScope = "row" | "selected" | "all";

export function OrdersTab() {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { setSide } = useOrderEntryActions();

	function handleSelectMarket(name: string, side: Side) {
		setSelectedMarket(scope, name);
		setSide(side);
	}
	const {
		data: openOrdersEvent,
		status,
		error,
	} = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const markets = useMarkets();
	const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(() => new Set());
	const [cancellingOids, setCancellingOids] = useState<Set<number>>(() => new Set());
	const [pendingScopes, setPendingScopes] = useState<Set<CancelScope>>(() => new Set());

	const { mutate: cancelOrders, error: cancelError, reset: resetCancelError } = useExchange("cancel");

	const openOrders = openOrdersEvent?.orders ?? [];

	const openIds = new Set(openOrders.map((order) => order.oid));
	const validSelectedIds = new Set<number>();
	for (const id of selectedOrderIds) {
		if (openIds.has(id)) validSelectedIds.add(id);
	}

	const selectedCount = validSelectedIds.size;
	const allSelected = selectedCount > 0 && selectedCount === openOrders.length;
	const someSelected = selectedCount > 0 && selectedCount < openOrders.length;

	function handleToggleAll(value: boolean | "indeterminate") {
		if (value === true) {
			setSelectedOrderIds(new Set(openOrders.map((order) => order.oid)));
		} else {
			setSelectedOrderIds(new Set());
		}
	}

	function handleToggleOrder(orderId: number, value: boolean | "indeterminate") {
		setSelectedOrderIds((prev) => {
			const next = new Set(prev);
			if (value === true) {
				next.add(orderId);
			} else {
				next.delete(orderId);
			}
			return next;
		});
	}

	function handleCancel(ordersToCancel: OpenOrder[], nextScope: CancelScope) {
		if (ordersToCancel.length === 0) return;

		const fresh = ordersToCancel.filter((order) => !cancellingOids.has(order.oid));
		if (fresh.length === 0) return;

		const cancels = fresh.reduce<{ a: number; o: number }[]>((acc, order) => {
			const assetId = markets.getMarket(order.coin)?.assetId;
			if (typeof assetId !== "number") return acc;
			acc.push({ a: assetId, o: order.oid });
			return acc;
		}, []);

		if (cancels.length === 0) return;

		const oids = fresh.map((order) => order.oid);
		setCancellingOids((prev) => {
			const next = new Set(prev);
			for (const oid of oids) next.add(oid);
			return next;
		});
		setPendingScopes((prev) => {
			const next = new Set(prev);
			next.add(nextScope);
			return next;
		});
		resetCancelError();
		cancelOrders(
			{ cancels },
			{
				onSuccess: () => {
					setSelectedOrderIds((prev) => {
						const next = new Set(prev);
						for (const order of fresh) {
							next.delete(order.oid);
						}
						return next;
					});
				},
				onSettled: () => {
					setCancellingOids((prev) => {
						const next = new Set(prev);
						for (const oid of oids) next.delete(oid);
						return next;
					});
					setPendingScopes((prev) => {
						const next = new Set(prev);
						next.delete(nextScope);
						return next;
					});
				},
			},
		);
	}

	function handleCancelRow(ordersToCancel: OpenOrder[]) {
		handleCancel(ordersToCancel, "row");
	}

	function handleCancelSelected() {
		const ordersToCancel = openOrders.filter((order) => validSelectedIds.has(order.oid));
		handleCancel(ordersToCancel, "selected");
	}

	function handleCancelAll() {
		handleCancel(openOrders, "all");
	}

	const disableCancelSelected = pendingScopes.has("selected") || selectedCount === 0;
	const disableCancelAll = pendingScopes.has("all") || openOrders.length === 0;
	const actionError = cancelError?.message;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view open orders.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading open orders...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load open orders.`}</span>
					{error instanceof Error && <span className="mt-1 text-xs text-fg-muted">{error.message}</span>}
				</Placeholder>
			);
		}
		if (openOrders.length === 0) return <Placeholder>{t`No open orders.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className={positionsPanelTabRootClass}>
			<div className={positionsPanelTableCaptionRowClass}>
				{isConnected ? (
					<span className="tabular-nums text-3xs text-fg-muted">
						{openOrders.length} {t`orders`}
					</span>
				) : null}
				{isConnected && selectedCount > 0 ? (
					<span className="tabular-nums text-3xs text-fg-muted">
						{selectedCount} {t`selected`}
					</span>
				) : null}
				<Button
					variant="link"
					size="xs"
					aria-label={t`Cancel selected orders`}
					onClick={handleCancelSelected}
					disabled={disableCancelSelected}
				>
					{pendingScopes.has("selected") ? t`Canceling...` : t`Cancel selected`}
				</Button>
				<Button
					variant="link"
					size="xs"
					aria-label={t`Cancel all orders`}
					onClick={handleCancelAll}
					disabled={disableCancelAll}
				>
					{pendingScopes.has("all") ? t`Canceling...` : t`Cancel all`}
				</Button>
			</div>
			{actionError ? <div className="px-2.5 py-1 text-2xs text-error">{actionError}</div> : null}
			<div className={positionsPanelTableShellClass}>
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table className="table-fixed min-w-[60rem] w-full">
							<TableHeader className={positionsPanelTableHeaderClass}>
								<TableRow className={positionsPanelTableHeaderRowClass}>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[3%] text-center")}
									>
										<Checkbox
											checked={allSelected}
											indeterminate={someSelected && !allSelected}
											onCheckedChange={handleToggleAll}
											aria-label={t`Select all orders`}
											disabled={openOrders.length === 0}
										/>
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[13%] text-left")}>
										{t`Time`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[19%] text-left")}>
										{t`Asset`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[15%] text-left")}>
										{t`Type`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[13%] text-right")}
									>
										{t`Price`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[15%] text-right")}
									>
										{t`Size`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[12%] text-left")}>
										{t`Trigger`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[10%] text-right")}
									>
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className={positionsPanelTableBodyClass}>
								{openOrders.map((order, i) => {
									return (
										<OrderRow
											key={order.oid}
											order={order}
											szDecimals={markets.getMarket(order.coin)?.szDecimals}
											isSelected={validSelectedIds.has(order.oid)}
											isCancelling={cancellingOids.has(order.oid)}
											isEven={i % 2 === 1}
											onToggle={handleToggleOrder}
											onCancel={handleCancelRow}
											onSelectMarket={handleSelectMarket}
										/>
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

interface OrderRowProps {
	order: OpenOrder;
	szDecimals: number | undefined;
	isSelected: boolean;
	isCancelling: boolean;
	isEven: boolean;
	onToggle: (orderId: number, value: boolean | "indeterminate") => void;
	onCancel: (orders: OpenOrder[]) => void;
	onSelectMarket: (marketName: string, side: Side) => void;
}

function OrderRow({
	order,
	szDecimals,
	isSelected,
	isCancelling,
	isEven,
	onToggle,
	onCancel,
	onSelectMarket,
}: OrderRowProps) {
	const typeConfig = getOrderTypeConfig(order);
	const isLong = order.side === "B";

	return (
		<TableRow className={cn(positionsPanelRowHoverClass, isEven && positionsPanelRowStripeClass)}>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-center")}>
				<Checkbox
					checked={isSelected}
					onCheckedChange={(value) => onToggle(order.oid, value)}
					aria-label={`${t`Select order`} ${order.coin}`}
					disabled={isCancelling}
				/>
			</TableCell>
			<TableCell
				size="dense"
				className={cn(positionsPanelTableCellClass, "whitespace-nowrap tabular-nums text-fg-muted")}
			>
				{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "font-medium text-fg")}>
				<AssetBadge
					coin={order.coin}
					side={isLong ? "buy" : "sell"}
					onClick={() => onSelectMarket(order.coin, isLong ? "buy" : "sell")}
					aria-label={
						isLong ? t`Switch to ${order.coin} market, long order` : t`Switch to ${order.coin} market, short order`
					}
				/>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-fg")}>
				<Tooltip content={typeConfig.fullLabel}>
					<span className="inline-flex items-baseline gap-1 text-xs whitespace-nowrap">
						{typeConfig.triggerLabel ? (
							<span className={cn("font-medium", typeConfig.triggerClass)}>{typeConfig.triggerLabel}</span>
						) : null}
						<span className="text-fg">{typeConfig.executionLabel}</span>
						{typeConfig.reduceOnly ? <span className="text-2xs uppercase text-fg-muted">RO</span> : null}
					</span>
				</Tooltip>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}>
				<span className="text-xs font-semibold tabular-nums leading-tight">
					{isMarketTriggerOrder(order) ? t`Market` : formatPrice(order.limitPx, { szDecimals })}
				</span>
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right text-fg")}>
				{isClosePositionOrder(order) ? (
					<span className="text-xs font-semibold text-fg-muted">{t`Close Position`}</span>
				) : (
					<div className="flex flex-col items-end gap-px">
						<span className="text-xs font-semibold tabular-nums leading-tight">
							{formatToken(order.origSz, { decimals: szDecimals, symbol: order.coin })}
						</span>
						<span className="text-2xs text-fg-muted tabular-nums leading-tight">
							({formatUSD(getOrderValue(order), { compact: true })})
						</span>
					</div>
				)}
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-fg-muted")}>
				{order.triggerCondition || FALLBACK_VALUE_PLACEHOLDER}
			</TableCell>
			<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right")}>
				<Button
					variant="link"
					size="sm"
					aria-label={t`Cancel order`}
					onClick={() => onCancel([order])}
					disabled={isCancelling}
				>
					{isCancelling ? t`Canceling...` : t`Cancel`}
				</Button>
			</TableCell>
		</TableRow>
	);
}
