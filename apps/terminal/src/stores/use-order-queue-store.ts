import { create } from "zustand";
import type { OrderOutcome, OrderResult, UnreadableSlot } from "@/lib/trade/extract-order-status";
import type { Lookup } from "@/lib/trade/order-sender";
import type { SlotHold } from "@/lib/trade/pending-requests";

export interface OrderQueueItem {
	id: string;
	market: string;
	side: "buy" | "sell";
	size: string;
	price?: string;
	orderType?: "market" | "limit" | "trigger" | "scale" | "twap";
	tpPrice?: string;
	slPrice?: string;
	status: "pending" | "success" | "failed" | "unknown" | "unsettled";
	outcome?: OrderOutcome;
	detail?: string;
	error?: string;
	requestKey?: string;
	canDismiss?: boolean;
	confirmDismiss?: { text: string; lookup: Lookup };
	unreadable?: UnreadableSlot;
	confirmUnreadable?: boolean;
	held?: SlotHold;
	confirmHold?: boolean;
	createdAt: number;
	completedAt?: number;
}

interface OrderQueueStore {
	orders: OrderQueueItem[];
	actions: {
		addOrder: (order: Omit<OrderQueueItem, "id" | "createdAt">) => string;
		updateOrder: (id: string, update: Partial<Omit<OrderQueueItem, "id">>) => void;
		updateByRequestKey: (requestKey: string, update: Partial<Omit<OrderQueueItem, "id">>) => void;
		upsertByRequestKey: (
			requestKey: string,
			base: Pick<OrderQueueItem, "market" | "side" | "size">,
			update: Partial<Omit<OrderQueueItem, "id">>,
		) => void;
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
		upsertByRequestKey: (requestKey, base, update) => {
			set((state) => ({ orders: upsertRequestRow(state.orders, requestKey, base, update) }));
		},
		removeOrder: (id) => {
			set((state) => ({
				orders: state.orders.filter((order) => order.id !== id),
			}));
		},
	},
}));

function applyUpdate(order: OrderQueueItem, update: Partial<Omit<OrderQueueItem, "id">>): OrderQueueItem {
	const completed = update.status === "success" || update.status === "failed" || update.status === "unknown";
	return { ...order, ...update, completedAt: completed ? Date.now() : order.completedAt };
}

export function upsertRequestRow(
	orders: OrderQueueItem[],
	requestKey: string,
	base: Pick<OrderQueueItem, "market" | "side" | "size">,
	update: Partial<Omit<OrderQueueItem, "id">>,
): OrderQueueItem[] {
	if (orders.some((order) => order.requestKey === requestKey)) {
		return orders.map((order) => (order.requestKey === requestKey ? applyUpdate(order, update) : order));
	}
	const added: OrderQueueItem = {
		...base,
		status: "unsettled",
		requestKey,
		id: generateOrderId(),
		createdAt: Date.now(),
	};
	return [...orders, applyUpdate(added, update)];
}

export function resultToQueueUpdate(result: OrderResult): Partial<Omit<OrderQueueItem, "id">> {
	const cleared = {
		confirmDismiss: undefined,
		unreadable: undefined,
		confirmUnreadable: undefined,
		held: undefined,
		confirmHold: undefined,
		outcome: undefined,
		detail: undefined,
		error: undefined,
	};
	if (result.ok) return { ...cleared, status: "success", outcome: result.outcome, detail: result.detail };
	switch (result.status) {
		case "unsettled":
			return {
				...cleared,
				status: "unsettled",
				error: result.error,
				requestKey: result.requestKey,
				canDismiss: result.canDismiss,
			};
		case "notSent":
			return { ...cleared, status: "failed", error: result.error, unreadable: result.unreadable };
		default:
			return { ...cleared, status: result.status, error: result.error };
	}
}

export function requestResultToQueueUpdate(result: OrderResult): Partial<Omit<OrderQueueItem, "id">> {
	if (!result.ok && result.status === "notSent") {
		return { status: "unsettled", error: result.error, confirmDismiss: undefined };
	}
	return resultToQueueUpdate(result);
}

export function shouldClearTicket(result: OrderResult): boolean {
	return result.ok || result.status === "unknown" || result.status === "unsettled";
}

export function useOrderQueue() {
	return useOrderQueueStore((state) => state.orders);
}

export function useOrderQueueActions() {
	return useOrderQueueStore((state) => state.actions);
}
