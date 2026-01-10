import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_MARKET_KEY, STORAGE_KEYS } from "@/config/interface";
import { createValidatedStorage } from "@/stores/validated-storage";

const marketPrefsSchema = z.object({
	state: z.object({
		selectedMarketKey: z.string().optional(),
		favoriteMarketKeys: z.array(z.string()).optional(),
	}),
});

const validatedStorage = createValidatedStorage(marketPrefsSchema, "market prefs");

interface MarketPrefsStore {
	selectedMarketKey: string;
	favoriteMarketKeys: string[];
	actions: {
		setSelectedMarketKey: (marketKey: string) => void;
		toggleFavoriteMarketKey: (marketKey: string) => void;
	};
}

const useMarketPrefsStore = create<MarketPrefsStore>()(
	persist(
		(set) => ({
			selectedMarketKey: DEFAULT_MARKET_KEY,
			favoriteMarketKeys: [],
			actions: {
				setSelectedMarketKey: (marketKey) => {
					set({ selectedMarketKey: marketKey });
				},
				toggleFavoriteMarketKey: (marketKey) => {
					set((state) => ({
						favoriteMarketKeys: state.favoriteMarketKeys.includes(marketKey)
							? state.favoriteMarketKeys.filter((k) => k !== marketKey)
							: [...state.favoriteMarketKeys, marketKey],
					}));
				},
			},
		}),
		{
			name: STORAGE_KEYS.MARKET_PREFS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				selectedMarketKey: state.selectedMarketKey,
				favoriteMarketKeys: state.favoriteMarketKeys,
			}),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<MarketPrefsStore>),
			}),
		},
	),
);

export function useSelectedMarketKey() {
	return useMarketPrefsStore((state) => state.selectedMarketKey);
}

export function useFavoriteMarketKeys() {
	return useMarketPrefsStore((state) => state.favoriteMarketKeys);
}

export function useMarketPrefsActions() {
	return useMarketPrefsStore((state) => state.actions);
}
