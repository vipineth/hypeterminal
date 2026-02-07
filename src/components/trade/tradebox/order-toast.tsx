import { t } from "@lingui/core/macro";
import { CheckIcon, LightningIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/config/constants";
import { cn } from "@/lib/cn";
import { type OrderQueueItem, useOrderQueue, useOrderQueueActions } from "@/stores/use-order-queue-store";

function useAutoRemove(order: OrderQueueItem, onRemove: () => void) {
	useEffect(() => {
		if (order.status !== "success" || !order.completedAt) return;

		const elapsed = Date.now() - order.completedAt;
		const remaining = ORDER_TOAST_SUCCESS_DURATION_MS - elapsed;

		if (remaining <= 0) {
			onRemove();
			return;
		}

		const timer = setTimeout(onRemove, remaining);
		return () => clearTimeout(timer);
	}, [order.status, order.completedAt, onRemove]);
}

function getOrderTypeLabel(orderType: OrderQueueItem["orderType"]): string | null {
	switch (orderType) {
		case "trigger":
			return "Trigger";
		case "scale":
			return "Scale";
		case "twap":
			return "TWAP";
		default:
			return null;
	}
}

function OrderItem({ order, onRemove }: { order: OrderQueueItem; onRemove: () => void }) {
	useAutoRemove(order, onRemove);

	const sideColor = order.side === "buy" ? "text-market-up-primary" : "text-market-down-primary";
	const sideBg = order.side === "buy" ? "bg-market-up-subtle" : "bg-market-down-subtle";
	const orderTypeLabel = getOrderTypeLabel(order.orderType);
	const hasTpSl = order.tpPrice || order.slPrice;

	return (
		<div
			className={cn(
				"flex gap-3 py-2.5 px-3 transition-all duration-300",
				order.status === "pending" && "animate-pulse",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center size-7 rounded-md shrink-0",
					order.status === "pending" && "bg-status-info/15 border border-status-info/30",
					order.status === "success" && "bg-market-up-subtle border border-market-up-primary/30",
					order.status === "failed" && "bg-market-down-subtle border border-market-down-primary/30",
				)}
			>
				{order.status === "pending" && <SpinnerGapIcon className="size-4 animate-spin text-status-info" />}
				{order.status === "success" && <CheckIcon className="size-4 text-market-up-primary" />}
				{order.status === "failed" && <XIcon className="size-4 text-market-down-primary" />}
			</div>

			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					{orderTypeLabel && (
						<span className="px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wide bg-surface-alt text-fg-700">
							{orderTypeLabel}
						</span>
					)}
					<span className={cn("px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wide", sideBg, sideColor)}>
						{order.side}
					</span>
					<span className="text-xs font-medium text-fg-900">{order.market}</span>
					{order.status === "success" && order.fillPercent !== undefined && (
						<span className="text-2xs text-market-up-primary font-medium">
							{order.fillPercent}
							{t`% filled`}
						</span>
					)}
				</div>
				<div className="text-2xs text-fg-700 flex items-center gap-2 flex-wrap">
					<span>
						{t`Size`}: <span className="text-fg-900/80 font-medium">{order.size}</span>
					</span>
					{order.price && (
						<span>
							@ <span className="text-fg-900/80 font-medium">{order.price}</span>
						</span>
					)}
				</div>
				{hasTpSl && (
					<div className="text-2xs text-fg-700 flex items-center gap-2">
						{order.tpPrice && (
							<span>
								TP: <span className="text-market-up-primary font-medium">{order.tpPrice}</span>
							</span>
						)}
						{order.slPrice && (
							<span>
								SL: <span className="text-market-down-primary font-medium">{order.slPrice}</span>
							</span>
						)}
					</div>
				)}
				{order.error && <div className="text-2xs text-market-down-primary">{order.error}</div>}
			</div>

			{order.status === "failed" && (
				<Button
					variant="text"
					size="none"
					onClick={onRemove}
					className="p-1.5 rounded-md text-fg-700 hover:text-fg-900 hover:bg-surface-alt/50 transition-colors shrink-0 self-start"
					aria-label={t`Dismiss`}
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}

function CountdownBar({ order }: { order: OrderQueueItem }) {
	if (order.status !== "success") return null;

	return (
		<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-market-up-subtle overflow-hidden">
			<div
				className="h-full bg-market-up-primary/60 animate-countdown"
				style={{ animationDuration: `${ORDER_TOAST_SUCCESS_DURATION_MS}ms` }}
			/>
		</div>
	);
}

export function OrderToast() {
	const orders = useOrderQueue();
	const { removeOrder } = useOrderQueueActions();

	if (orders.length === 0) return null;

	const pendingCount = orders.filter((o) => o.status === "pending").length;
	const successCount = orders.filter((o) => o.status === "success").length;
	const failedCount = orders.filter((o) => o.status === "failed").length;

	return (
		<div
			className={cn(
				"fixed bottom-6 right-6 z-50 w-80",
				"bg-surface-800/95 backdrop-blur-sm",
				"border border-border/60 rounded-lg overflow-hidden",
				"shadow-2xl shadow-black/20 dark:shadow-black/50",
				"font-mono",

				pendingCount > 0 && "ring-1 ring-status-info/30",
				failedCount > 0 && pendingCount === 0 && "ring-1 ring-market-down-primary/30",
				successCount > 0 && pendingCount === 0 && failedCount === 0 && "ring-1 ring-market-up-primary/30",
			)}
		>
			<div className="px-3 py-2 border-b border-border/40 bg-surface-alt/30 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<LightningIcon className="size-4 text-status-info" />
					<span className="text-xs font-semibold uppercase tracking-wider text-fg-900">{t`Order Queue`}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{pendingCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-status-info/15 text-status-info border border-status-info/30">
							{pendingCount} {t`pending`}
						</span>
					)}
					{failedCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-market-down-subtle text-market-down-primary border border-market-down-primary/30">
							{failedCount} {t`failed`}
						</span>
					)}
				</div>
			</div>

			<div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
				{orders.map((order) => (
					<div key={order.id} className="relative">
						<OrderItem order={order} onRemove={() => removeOrder(order.id)} />
						<CountdownBar order={order} />
					</div>
				))}
			</div>

			<div className="absolute inset-0 pointer-events-none terminal-scanlines opacity-30" />
		</div>
	);
}
