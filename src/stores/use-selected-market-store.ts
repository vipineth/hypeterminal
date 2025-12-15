import { create } from "zustand";

interface SelectedMarketStore {
	coin: string;
	actions: {
		setCoin: (coin: string) => void;
	};
}

const useSelectedMarketStore = create<SelectedMarketStore>((set) => ({
	coin: "BTC",
	actions: {
		setCoin: (coin) => set({ coin }),
	},
}));

export function useSelectedMarket() {
	return useSelectedMarketStore((state) => state.coin);
}

export function useSelectedMarketActions() {
	return useSelectedMarketStore((state) => state.actions);
}
