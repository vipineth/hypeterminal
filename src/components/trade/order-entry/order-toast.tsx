import { t } from "@lingui/core/macro";
import { Check, Loader2, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/config/interface";
import clsx from "clsx";
import { type OrderQueueItem, useOrderQueue, useOrderQueueActions } from "@/stores/use-order-queue-store";

function useAutoRemove(order: OrderQueueItem, onRemove: () => void) {
	useEffect(() => {
		if (order.status !== "success" || !order.completedAt) return;

		const elapsed = Date.now() - order.completedAt;
		const remaining = ORDER_TOAST_SUCCESS_DURATION_MS - elapsed;

		// Already expired, remove immediately
		if (remaining <= 0) {
			onRemove();
			return;
		}

		// Schedule removal
		const timer = setTimeout(onRemove, remaining);
		return () => clearTimeout(timer);
	}, [order.status, order.completedAt, onRemove]);
}

function OrderItem({ order, onRemove }: { order: OrderQueueItem; onRemove: () => void }) {
	// Auto-remove successful orders after duration
	useAutoRemove(order, onRemove);

	const sideColor = order.side === "buy" ? "text-terminal-green" : "text-terminal-red";
	const sideBg = order.side === "buy" ? "bg-terminal-green/10" : "bg-terminal-red/10";
	const sideGlow = order.side === "buy" ? "terminal-glow-green" : "terminal-glow-red";

	return (
		<div
			className={clsx(
				"flex items-center gap-3 py-2.5 px-3 transition-all duration-300",
				order.status === "pending" && "animate-pulse",
			)}
		>
			{/* Status Icon */}
			<div
				className={clsx(
					"flex items-center justify-center size-7 rounded-md shrink-0",
					order.status === "pending" && "bg-terminal-cyan/15 border border-terminal-cyan/30",
					order.status === "success" && "bg-terminal-green/15 border border-terminal-green/30",
					order.status === "failed" && "bg-terminal-red/15 border border-terminal-red/30",
				)}
			>
				{order.status === "pending" && (
					<Loader2 className="size-4 animate-spin text-terminal-cyan terminal-glow-cyan" />
				)}
				{order.status === "success" && <Check className="size-4 text-terminal-green terminal-glow-green" />}
				{order.status === "failed" && <X className="size-4 text-terminal-red terminal-glow-red" />}
			</div>

			{/* Order Details */}
			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					<span
						className={clsx(
							"px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wide",
							sideBg,
							sideColor,
							sideGlow,
						)}
					>
						{order.side}
					</span>
					<span className="text-xs font-medium text-foreground">{order.market}</span>
					{order.status === "success" && order.fillPercent !== undefined && (
						<span className="text-2xs text-terminal-green terminal-glow-green font-medium">
							{order.fillPercent}
							{t`% filled`}
						</span>
					)}
				</div>
				<div className="text-2xs text-muted-foreground">
					{t`Size`}: <span className="text-foreground/80 font-medium">{order.size}</span>
				</div>
				{order.error && <div className="text-2xs text-terminal-red terminal-glow-red truncate">{order.error}</div>}
			</div>

			{/* Dismiss Button for Failed Orders */}
			{order.status === "failed" && (
				<button
					type="button"
					onClick={onRemove}
					className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
					aria-label={t`Dismiss`}
				>
					<X className="size-4" />
				</button>
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
		<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-green/20 overflow-hidden">
			<div
				className="h-full bg-terminal-green/60 transition-all duration-50 ease-linear"
				style={{ width: `${progress}%` }}
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
			className={clsx(
				"fixed bottom-6 right-6 z-50 w-80",
				"bg-surface/95 backdrop-blur-sm",
				"border border-border/60 rounded-lg overflow-hidden",
				"shadow-2xl shadow-black/20 dark:shadow-black/50",
				"font-mono",

				pendingCount > 0 && "ring-1 ring-terminal-cyan/30 dark:shadow-[0_0_30px_-5px_oklch(0.78_0.12_195_/_0.2)]",
				failedCount > 0 &&
					pendingCount === 0 &&
					"ring-1 ring-terminal-red/30 dark:shadow-[0_0_30px_-5px_oklch(0.65_0.22_25_/_0.2)]",
				successCount > 0 &&
					pendingCount === 0 &&
					failedCount === 0 &&
					"ring-1 ring-terminal-green/30 dark:shadow-[0_0_30px_-5px_oklch(0.75_0.18_145_/_0.2)]",
			)}
		>
			{/* Header */}
			<div className="px-3 py-2 border-b border-border/40 bg-muted/30 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Zap className="size-4 text-terminal-cyan terminal-glow-cyan" />
					<span className="text-xs font-semibold uppercase tracking-wider text-foreground">{t`Order Queue`}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{pendingCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-terminal-cyan/15 text-terminal-cyan border border-terminal-cyan/30">
							{pendingCount} {t`pending`}
						</span>
					)}
					{failedCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-terminal-red/15 text-terminal-red border border-terminal-red/30">
							{failedCount} {t`failed`}
						</span>
					)}
				</div>
			</div>

			{/* Orders List */}
			<div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
				{orders.map((order) => (
					<div key={order.id} className="relative">
						<OrderItem order={order} onRemove={() => removeOrder(order.id)} />
						<CountdownBar order={order} />
					</div>
				))}
			</div>

			{/* Terminal Scanlines Overlay */}
			<div className="absolute inset-0 pointer-events-none terminal-scanlines opacity-30" />
		</div>
	);
}
