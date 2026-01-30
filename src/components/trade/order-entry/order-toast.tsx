import { t } from "@lingui/core/macro";
import { Check, Loader2, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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

function OrderItem({ order, onRemove }: { order: OrderQueueItem; onRemove: () => void }) {
	useAutoRemove(order, onRemove);

	const sideColor = order.side === "buy" ? "text-positive" : "text-negative";
	const sideBg = order.side === "buy" ? "bg-positive/10" : "bg-negative/10";

	return (
		<div
			className={cn(
				"flex items-center gap-3 py-2.5 px-3 transition-all duration-300",
				order.status === "pending" && "animate-pulse",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center size-7 rounded-md shrink-0",
					order.status === "pending" && "bg-info/15 border border-info/30",
					order.status === "success" && "bg-positive/15 border border-positive/30",
					order.status === "failed" && "bg-negative/15 border border-negative/30",
				)}
			>
				{order.status === "pending" && <Loader2 className="size-4 animate-spin text-info" />}
				{order.status === "success" && <Check className="size-4 text-positive" />}
				{order.status === "failed" && <X className="size-4 text-negative" />}
			</div>

			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					<span className={cn("px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wide", sideBg, sideColor)}>
						{order.side}
					</span>
					<span className="text-xs font-medium text-fg">{order.market}</span>
					{order.status === "success" && order.fillPercent !== undefined && (
						<span className="text-2xs text-positive font-medium">
							{order.fillPercent}
							{t`% filled`}
						</span>
					)}
				</div>
				<div className="text-2xs text-muted-fg">
					{t`Size`}: <span className="text-fg/80 font-medium">{order.size}</span>
				</div>
				{order.error && <div className="text-2xs text-negative truncate">{order.error}</div>}
			</div>

			{order.status === "failed" && (
				<Button
					variant="ghost"
					size="none"
					onClick={onRemove}
					className="p-1.5 rounded-md text-muted-fg hover:text-fg hover:bg-muted/50 transition-colors shrink-0"
					aria-label={t`Dismiss`}
				>
					<X className="size-4" />
				</Button>
			)}
		</div>
	);
}

function CountdownBar({ order }: { order: OrderQueueItem }) {
	const [progress, setProgress] = useState(100);

	useEffect(() => {
		const completedAt = order.completedAt;
		if (order.status !== "success" || !completedAt) {
			setProgress(100);
			return;
		}

		const updateProgress = () => {
			const elapsed = Date.now() - completedAt;
			const remaining = Math.max(0, ORDER_TOAST_SUCCESS_DURATION_MS - elapsed);
			setProgress((remaining / ORDER_TOAST_SUCCESS_DURATION_MS) * 100);
		};

		updateProgress();
		const interval = setInterval(updateProgress, 50);
		return () => clearInterval(interval);
	}, [order.status, order.completedAt]);

	if (order.status !== "success") return null;

	return (
		<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-positive/20 overflow-hidden">
			<div className="h-full bg-positive/60 transition-all duration-50 ease-linear" style={{ width: `${progress}%` }} />
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
				"bg-surface/95 backdrop-blur-sm",
				"border border-border/60 rounded-lg overflow-hidden",
				"shadow-2xl shadow-black/20 dark:shadow-black/50",
				"font-mono",

				pendingCount > 0 && "ring-1 ring-info/30",
				failedCount > 0 && pendingCount === 0 && "ring-1 ring-negative/30",
				successCount > 0 && pendingCount === 0 && failedCount === 0 && "ring-1 ring-positive/30",
			)}
		>
			<div className="px-3 py-2 border-b border-border/40 bg-muted/30 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Zap className="size-4 text-info" />
					<span className="text-xs font-semibold uppercase tracking-wider text-fg">{t`Order Queue`}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{pendingCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-info/15 text-info border border-info/30">
							{pendingCount} {t`pending`}
						</span>
					)}
					{failedCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-negative/15 text-negative border border-negative/30">
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
