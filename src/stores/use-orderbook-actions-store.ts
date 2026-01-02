import { create } from "zustand";

interface OrderbookActionsStore {
	/** Price selected from orderbook click */
	selectedPrice: number | null;
	/** Set price from orderbook click (triggers limit order) */
	setSelectedPrice: (price: number) => void;
	/** Clear selected price after consumption */
	clearSelectedPrice: () => void;
}

export const useOrderbookActionsStore = create<OrderbookActionsStore>((set) => ({
	selectedPrice: null,
	setSelectedPrice: (price) => set({ selectedPrice: price }),
	clearSelectedPrice: () => set({ selectedPrice: null }),
}));

export const useSelectedPrice = () => useOrderbookActionsStore((s) => s.selectedPrice);
export const useSetSelectedPrice = () => useOrderbookActionsStore((s) => s.setSelectedPrice);
