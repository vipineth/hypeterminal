import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CheckIcon, LightningIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/config/time";
import { cn } from "@/lib/cn";
import { useGlobalSettings } from "@/stores/use-global-settings-store";
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

	const sideColor = order.side === "buy" ? "text-text-success" : "text-text-error";
	const sideBg = order.side === "buy" ? "bg-fill-success-weak" : "bg-fill-error-weak";
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
					"flex items-center justify-center size-7 rounded-8 shrink-0",
					order.status === "pending" && "bg-fill-brand-weak border border-stroke-brand-strong/30",
					order.status === "success" && "bg-fill-success-weak border border-stroke-success-strong/30",
					order.status === "failed" && "bg-fill-error-weak border border-stroke-error-strong/30",
				)}
			>
				{order.status === "pending" && <SpinnerGapIcon className="size-4 animate-spin text-text-brand" />}
				{order.status === "success" && <CheckIcon className="size-4 text-text-success" />}
				{order.status === "failed" && <XIcon className="size-4 text-text-error" />}
			</div>

			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					{orderTypeLabel && (
						<span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-bg-raised text-text-weak">
							{orderTypeLabel}
						</span>
					)}
					<span className={cn("px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide", sideBg, sideColor)}>
						{order.side}
					</span>
					<span className="text-xs font-medium text-text-strong">{order.market}</span>
					{order.status === "success" && order.fillPercent !== undefined && (
						<span className="text-xs text-text-success font-medium">
							{order.fillPercent}
							{t`% filled`}
						</span>
					)}
				</div>
				<div className="text-xs text-text-weak flex items-center gap-2 flex-wrap">
					<span>
						{t`Size`}: <span className="text-text-strong font-medium">{order.size}</span>
					</span>
					{order.price && (
						<span>
							@ <span className="text-text-strong font-medium">{order.price}</span>
						</span>
					)}
				</div>
				{hasTpSl && (
					<div className="text-xs text-text-weak flex items-center gap-2">
						{order.tpPrice && (
							<span>
								TP: <span className="text-text-success font-medium">{order.tpPrice}</span>
							</span>
						)}
						{order.slPrice && (
							<span>
								SL: <span className="text-text-error font-medium">{order.slPrice}</span>
							</span>
						)}
					</div>
				)}
				{order.error && <div className="text-xs text-text-error">{order.error}</div>}
			</div>

			{order.status === "failed" && (
				<Button
					variant="ghost"
					intent="neutral"
					onClick={onRemove}
					className="p-1.5 rounded-8 text-text-weak hover:text-text-strong hover:bg-fill-hover transition-colors shrink-0 self-start"
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
		<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fill-success-weak overflow-hidden">
			<div
				className="h-full bg-fill-success-strong/60 animate-countdown"
				style={{ animationDuration: `${ORDER_TOAST_SUCCESS_DURATION_MS}ms` }}
			/>
		</div>
	);
}

export function OrderToast() {
	const orders = useOrderQueue();
	const { removeOrder } = useOrderQueueActions();
	const { showChartScanlines } = useGlobalSettings();

	if (orders.length === 0) return null;

	const pendingCount = orders.filter((o) => o.status === "pending").length;
	const successCount = orders.filter((o) => o.status === "success").length;
	const failedCount = orders.filter((o) => o.status === "failed").length;

	return (
		<div
			className={cn(
				"fixed bottom-6 right-6 z-50 w-80",
				"bg-bg-overlay/95 backdrop-blur-sm",
				"border border-stroke-weak/60 rounded-8 overflow-hidden",
				"shadow-overlay shadow-black/20 dark:shadow-black/50",
				"font-sans",

				pendingCount > 0 && "ring-1 ring-stroke-brand-strong/30",
				failedCount > 0 && pendingCount === 0 && "ring-1 ring-stroke-error-strong/30",
				successCount > 0 && pendingCount === 0 && failedCount === 0 && "ring-1 ring-stroke-success-strong/30",
			)}
		>
			<div className="px-3 py-2 border-b border-stroke-weak/40 bg-bg-raised flex items-center justify-between">
				<div className="flex items-center gap-2">
					<LightningIcon className="size-4 text-text-brand" />
					<span className="text-xs font-semibold uppercase tracking-wider text-text-strong">{t`Order Queue`}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{pendingCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-xs font-medium bg-fill-brand-weak text-text-brand border border-stroke-brand-strong/30">
							{pendingCount} {t`pending`}
						</span>
					)}
					{failedCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-xs font-medium bg-fill-error-weak text-text-error border border-stroke-error-strong/30">
							{failedCount} {t`failed`}
						</span>
					)}
				</div>
			</div>

			<div className="divide-y divide-stroke-weak/30 max-h-72 overflow-y-auto">
				{orders.map((order) => (
					<div key={order.id} className="relative">
						<OrderItem order={order} onRemove={() => removeOrder(order.id)} />
						<CountdownBar order={order} />
					</div>
				))}
			</div>

			{showChartScanlines && <div className="absolute inset-0 pointer-events-none terminal-scanlines opacity-30" />}
		</div>
	);
}
