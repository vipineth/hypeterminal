import { create } from "zustand";
import type { OrderOutcome, OrderResult } from "@/lib/trade/extract-order-status";

export interface OrderQueueItem {
	id: string;
	market: string;
	side: "buy" | "sell";
	size: string;
	price?: string;
	orderType?: "market" | "limit" | "trigger" | "scale" | "twap";
	tpPrice?: string;
	slPrice?: string;
	status: "pending" | "success" | "failed" | "unsettled";
	outcome?: OrderOutcome;
	detail?: string;
	error?: string;
	requestKey?: string;
	createdAt: number;
	completedAt?: number;
}

interface OrderQueueStore {
	orders: OrderQueueItem[];
	actions: {
		addOrder: (order: Omit<OrderQueueItem, "id" | "createdAt">) => string;
		updateOrder: (id: string, update: Partial<Omit<OrderQueueItem, "id">>) => void;
		updateByRequestKey: (requestKey: string, update: Partial<Omit<OrderQueueItem, "id">>) => void;
		removeOrder: (id: string) => void;
	};
}

let orderIdCounter = 0;

function generateOrderId(): string {
	return `order-${Date.now()}-${++orderIdCounter}`;
}

const useOrderQueueStore = create<OrderQueueStore>()((set) => ({
	orders: [],
	actions: {
		addOrder: (order) => {
			const id = generateOrderId();
			const newOrder: OrderQueueItem = {
				...order,
				id,
				createdAt: Date.now(),
			};
			set((state) => ({
				orders: [...state.orders, newOrder],
			}));
			return id;
		},
		updateOrder: (id, update) => {
			set((state) => ({
				orders: state.orders.map((order) => (order.id === id ? applyUpdate(order, update) : order)),
			}));
		},
		updateByRequestKey: (requestKey, update) => {
			set((state) => ({
				orders: state.orders.map((order) => (order.requestKey === requestKey ? applyUpdate(order, update) : order)),
			}));
		},
		removeOrder: (id) => {
			set((state) => ({
				orders: state.orders.filter((order) => order.id !== id),
			}));
		},
	},
}));

function applyUpdate(order: OrderQueueItem, update: Partial<Omit<OrderQueueItem, "id">>): OrderQueueItem {
	const completed = update.status === "success" || update.status === "failed";
	return { ...order, ...update, completedAt: completed ? Date.now() : order.completedAt };
}

export function resultToQueueUpdate(result: OrderResult): Partial<Omit<OrderQueueItem, "id">> {
	if (result.ok) return { status: "success", outcome: result.outcome, detail: result.detail, error: undefined };
	if (result.requestKey) return { status: "unsettled", error: result.error, requestKey: result.requestKey };
	return { status: "failed", error: result.error, outcome: undefined, detail: undefined };
}

export function useOrderQueue() {
	return useOrderQueueStore((state) => state.orders);
}

export function useOrderQueueActions() {
	return useOrderQueueStore((state) => state.actions);
}
