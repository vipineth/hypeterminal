import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_MARKET_NAME, STORAGE_KEYS } from "@/config/constants";
import { createValidatedStorage } from "@/stores/validated-storage";

const marketStoreSchema = z.object({
	state: z.object({
		selectedMarket: z.string().optional(),
		favoriteMarkets: z.array(z.string()).optional(),
	}),
});

const validatedStorage = createValidatedStorage(marketStoreSchema, "market store");

const DEFAULT_MARKET_STORE: Pick<MarketStore, "selectedMarket" | "favoriteMarkets"> = {
	selectedMarket: DEFAULT_MARKET_NAME,
	favoriteMarkets: ["BTC", "ETH", "HYPE"],
};

interface MarketStore {
	selectedMarket: string;
	favoriteMarkets: string[];
	actions: {
		setSelectedMarket: (marketName: string) => void;
		toggleFavoriteMarket: (marketName: string) => void;
	};
}

const useMarketStore = create<MarketStore>()(
	persist(
		(set) => ({
			...DEFAULT_MARKET_STORE,
			actions: {
				setSelectedMarket: (marketName) => {
					set({ selectedMarket: marketName });
				},
				toggleFavoriteMarket: (marketName) => {
					set((state) => ({
						favoriteMarkets: state.favoriteMarkets.includes(marketName)
							? state.favoriteMarkets.filter((m) => m !== marketName)
							: [...state.favoriteMarkets, marketName],
					}));
				},
			},
		}),
		{
			name: STORAGE_KEYS.MARKET_PREFS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				selectedMarket: state.selectedMarket,
				favoriteMarkets: state.favoriteMarkets,
			}),
			merge: (persisted, current) => {
				const p = persisted as Partial<MarketStore>;
				return {
					...current,
					...DEFAULT_MARKET_STORE,
					selectedMarket: p?.selectedMarket ?? DEFAULT_MARKET_STORE.selectedMarket,
					favoriteMarkets: Array.isArray(p?.favoriteMarkets)
						? p.favoriteMarkets
						: DEFAULT_MARKET_STORE.favoriteMarkets,
				};
			},
		},
	),
);

export function useSelectedMarket() {
	return useMarketStore((state) => state.selectedMarket);
}

export function useFavoriteMarkets() {
	return useMarketStore((state) => state.favoriteMarkets);
}

export function useMarketActions() {
	return useMarketStore((state) => state.actions);
}
