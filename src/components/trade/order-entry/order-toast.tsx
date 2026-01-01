import { Check, Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/constants/ui-timing";
import { cn } from "@/lib/utils";
import { type OrderQueueItem, useOrderQueue, useOrderQueueActions } from "@/stores/use-order-queue-store";

function OrderItem({ order, onRemove }: { order: OrderQueueItem; onRemove: () => void }) {
	const sideColor = order.side === "buy" ? "text-terminal-green" : "text-terminal-red";

	return (
		<div className="flex items-center justify-between gap-2 py-1.5 px-2 text-3xs">
			<div className="flex items-center gap-2 min-w-0">
				{order.status === "pending" && <Loader2 className="size-3 animate-spin text-terminal-cyan shrink-0" />}
				{order.status === "success" && <Check className="size-3 text-terminal-green shrink-0" />}
				{order.status === "failed" && <X className="size-3 text-terminal-red shrink-0" />}
				<span className={cn("font-medium uppercase", sideColor)}>{order.side}</span>
				<span className="text-muted-foreground truncate">
					{order.size} {order.market}
				</span>
				{order.status === "success" && order.fillPercent !== undefined && (
					<span className="text-terminal-green">{order.fillPercent}%</span>
				)}
			</div>
			{order.status === "failed" && (
				<button
					type="button"
					onClick={onRemove}
					className="text-muted-foreground hover:text-foreground shrink-0"
					aria-label="Dismiss"
				>
					<X className="size-3" />
				</button>
			)}
			{order.error && <span className="text-terminal-red text-4xs truncate max-w-24">{order.error}</span>}
		</div>
	);
}

export function OrderToast() {
	const orders = useOrderQueue();
	const { removeOrder } = useOrderQueueActions();

	// Auto-remove successful orders after delay
	useEffect(() => {
		const timers: NodeJS.Timeout[] = [];

		for (const order of orders) {
			if (order.status === "success" && order.completedAt) {
				const elapsed = Date.now() - order.completedAt;
				const remaining = ORDER_TOAST_SUCCESS_DURATION_MS - elapsed;

				if (remaining > 0) {
					const timer = setTimeout(() => {
						removeOrder(order.id);
					}, remaining);
					timers.push(timer);
				} else {
					removeOrder(order.id);
				}
			}
		}

		return () => {
			for (const timer of timers) {
				clearTimeout(timer);
			}
		};
	}, [orders, removeOrder]);

	if (orders.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 w-64 bg-surface border border-border/60 shadow-lg font-mono">
			<div className="px-2 py-1.5 border-b border-border/40 text-3xs font-medium uppercase tracking-wider text-muted-foreground">
				Orders
			</div>
			<div className="divide-y divide-border/40 max-h-48 overflow-y-auto">
				{orders.map((order) => (
					<OrderItem key={order.id} order={order} onRemove={() => removeOrder(order.id)} />
				))}
			</div>
		</div>
	);
}
