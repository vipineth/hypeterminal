import { create } from "zustand";

interface OrderbookActionsState {
	selectedPrice: number | null;
}

interface OrderbookActions {
	setSelectedPrice: (price: number) => void;
	clearSelectedPrice: () => void;
}

interface OrderbookActionsStore extends OrderbookActionsState {
	actions: OrderbookActions;
}

const useOrderbookActionsStore = create<OrderbookActionsStore>((set) => ({
	selectedPrice: null,
	actions: {
		setSelectedPrice: (price) => set({ selectedPrice: price }),
		clearSelectedPrice: () => set({ selectedPrice: null }),
	},
}));

export const useSelectedPrice = () => useOrderbookActionsStore((s) => s.selectedPrice);
export const useOrderbookActions = () => useOrderbookActionsStore((s) => s.actions);
export const getOrderbookActionsStore = () => useOrderbookActionsStore.getState();
