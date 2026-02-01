import { create } from "zustand";

export interface OrderQueueItem {
	id: string;
	market: string;
	side: "buy" | "sell";
	size: string;
	price?: string;
	orderType?: "market" | "limit" | "trigger" | "scale" | "twap";
	tpPrice?: string;
	slPrice?: string;
	status: "pending" | "success" | "failed";
	fillPercent?: number;
	error?: string;
	createdAt: number;
	completedAt?: number;
}

interface OrderQueueStore {
	orders: OrderQueueItem[];
	actions: {
		addOrder: (order: Omit<OrderQueueItem, "id" | "createdAt">) => string;
		updateOrder: (id: string, update: Partial<Omit<OrderQueueItem, "id">>) => void;
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
				orders: state.orders.map((order) =>
					order.id === id
						? {
								...order,
								...update,
								completedAt: update.status === "success" || update.status === "failed" ? Date.now() : order.completedAt,
							}
						: order,
				),
			}));
		},
		removeOrder: (id) => {
			set((state) => ({
				orders: state.orders.filter((order) => order.id !== id),
			}));
		},
	},
}));

export function useOrderQueue() {
	return useOrderQueueStore((state) => state.orders);
}

export function useOrderQueueActions() {
	return useOrderQueueStore((state) => state.actions);
}
