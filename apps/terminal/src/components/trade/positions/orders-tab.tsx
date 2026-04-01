import { Button, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ListNumbersIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useExchange, useMarkets, useSubscription } from "@/lib/hyperliquid";
import type { MarketKind } from "@/lib/hyperliquid/markets";
import { getOrderTypeConfig, getOrderValue, getSideClass, getSideLabel, type OpenOrder } from "@/lib/trade/open-orders";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "../components/asset-display";

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

export function OrdersTab() {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const {
		data: openOrdersEvent,
		status,
		error,
	} = useSubscription("openOrders", { user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const markets = useMarkets();
	const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(() => new Set());

	const {
		mutate: cancelOrders,
		isPending: isCancelling,
		error: cancelError,
		reset: resetCancelError,
	} = useExchange("cancel");

	const openOrders = openOrdersEvent?.orders ?? [];
	const headerCount = isConnected ? selectedOrderIds.size : FALLBACK_VALUE_PLACEHOLDER;

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
				const assetId = markets.getAssetId(order.coin);
				if (typeof assetId !== "number") return acc;
				acc.push({ a: assetId, o: order.oid });
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
		[isCancelling, markets, cancelOrders, resetCancelError],
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
					{error instanceof Error && <span className="mt-1 text-xs text-text-weak">{error.message}</span>}
				</Placeholder>
			);
		}
		if (openOrders.length === 0) return <Placeholder>{t`No open orders.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-xs uppercase tracking-wider text-text-weak mb-1.5 flex items-center gap-2">
				<ListNumbersIcon className="size-3" />
				{t`Open Orders`}
				<div className="ml-auto flex items-center gap-2">
					<span className="text-text-brand tabular-nums">{headerCount}</span>
					<Button
						variant="link"
						size="sm"
						aria-label={t`Cancel selected orders`}
						onClick={handleCancelSelected}
						disabled={disableCancelSelected}
					>
						{isCancelling ? t`Canceling...` : t`Cancel selected`}
					</Button>
					<Button
						variant="link"
						size="sm"
						aria-label={t`Cancel all orders`}
						onClick={handleCancelAll}
						disabled={disableCancelAll}
					>
						{isCancelling ? t`Canceling...` : t`Cancel all`}
					</Button>
				</div>
			</div>
			{actionError ? <div className="mb-1 text-xs text-text-error">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-stroke-weak/40 rounded-8 bg-bg-sunken/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-stroke-weak/40 bg-bg-raised hover:bg-bg-raised">
									<TableHead className="w-7">
										<Checkbox
											checked={allSelected}
											indeterminate={someSelected && !allSelected}
											onCheckedChange={handleToggleAll}
											aria-label={t`Select all orders`}
											disabled={openOrders.length === 0 || isCancelling}
										/>
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Time`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Asset`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Type`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Trigger`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Reduce`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{openOrders.map((order, i) => {
									return (
										<OrderRow
											key={order.oid}
											order={order}
											kind={markets.getMarket(order.coin)?.kind}
											szDecimals={markets.getSzDecimals(order.coin)}
											isSelected={selectedOrderIds.has(order.oid)}
											isCancelling={isCancelling}
											canCancel={canCancel}
											isEven={i % 2 === 1}
											onToggle={handleToggleOrder}
											onCancel={handleCancelOrders}
											onSelectMarket={(name) => setSelectedMarket(scope, name)}
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
	kind: MarketKind | undefined;
	szDecimals: number;
	isSelected: boolean;
	isCancelling: boolean;
	canCancel: boolean;
	isEven: boolean;
	onToggle: (orderId: number, value: boolean | "indeterminate") => void;
	onCancel: (orders: OpenOrder[]) => void;
	onSelectMarket: (marketName: string) => void;
}

function OrderRow({
	order,
	kind,
	szDecimals,
	isSelected,
	isCancelling,
	canCancel,
	isEven,
	onToggle,
	onCancel,
	onSelectMarket,
}: OrderRowProps) {
	const typeConfig = getOrderTypeConfig(order);

	return (
		<TableRow className={cn("border-stroke-weak/40 hover:bg-bg-raised/30", isEven && "bg-bg-raised")}>
			<TableCell className="py-1.5">
				<Checkbox
					checked={isSelected}
					onCheckedChange={(value) => onToggle(order.oid, value)}
					aria-label={`${t`Select order`} ${order.coin}`}
					disabled={isCancelling}
				/>
			</TableCell>
			<TableCell className="text-xs text-text-weak py-1.5 whitespace-nowrap">
				{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
			</TableCell>
			<TableCell className="text-xs font-medium py-1.5">
				<div className="flex items-center gap-1.5">
					<Button
						variant="link"
						onClick={() => onSelectMarket(order.coin)}
						className="gap-1.5"
						aria-label={t`Switch to ${order.coin} market`}
					>
						<AssetDisplay coin={order.coin} />
					</Button>
					<span className={cn("text-xs px-1 py-0.5 rounded-8 uppercase", getSideClass(order.side))}>
						{getSideLabel(order.side, kind)}
					</span>
				</div>
			</TableCell>
			<TableCell className="text-xs py-1.5">
				<span className={cn("text-xs px-1 py-0.5 rounded-8 uppercase", typeConfig.class)}>{typeConfig.label}</span>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">
				{formatPrice(order.limitPx, { szDecimals })}
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">
				<div className="flex flex-col items-end">
					<span className="tabular-nums">
						{formatToken(order.origSz, { decimals: szDecimals, symbol: order.coin })}
					</span>
					<span className="text-xs text-text-weak">({formatUSD(getOrderValue(order), { compact: false })})</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-text-weak py-1.5">
				{order.triggerCondition || FALLBACK_VALUE_PLACEHOLDER}
			</TableCell>
			<TableCell className="text-xs py-1.5">
				{order.reduceOnly ? (
					<span className="text-text-brand">{t`Yes`}</span>
				) : (
					<span className="text-text-weak">{t`No`}</span>
				)}
			</TableCell>
			<TableCell className="text-right py-1.5">
				<Button
					variant="link"
					size="sm"
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
