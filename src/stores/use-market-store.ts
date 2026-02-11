import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_MARKET_NAME, STORAGE_KEYS } from "@/config/constants";
import { DEFAULT_SELECTED_MARKETS, type ExchangeScope } from "@/domain/market";
import { useExchangeScope } from "@/providers/exchange-scope";
import { createValidatedStorage } from "@/stores/validated-storage";

const marketStoreSchema = z.object({
	state: z.object({
		selectedMarkets: z.record(z.string(), z.string()).optional(),
		favoriteMarkets: z.array(z.string()).optional(),
	}),
});

const validatedStorage = createValidatedStorage(marketStoreSchema, "market store");

interface MarketStore {
	selectedMarkets: Record<ExchangeScope, string>;
	favoriteMarkets: string[];
	actions: {
		setSelectedMarket: (scope: ExchangeScope, marketName: string) => void;
		toggleFavoriteMarket: (marketName: string) => void;
	};
}

const useMarketStore = create<MarketStore>()(
	persist(
		(set) => ({
			selectedMarkets: { ...DEFAULT_SELECTED_MARKETS },
			favoriteMarkets: ["BTC", "ETH", "HYPE"],
			actions: {
				setSelectedMarket: (scope, marketName) => {
					set((state) => ({
						selectedMarkets: { ...state.selectedMarkets, [scope]: marketName },
					}));
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
			version: 3,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				selectedMarkets: state.selectedMarkets,
				favoriteMarkets: state.favoriteMarkets,
			}),
			merge: (persisted, current) => {
				const p = persisted as Partial<MarketStore> & { selectedMarket?: string };

				let selectedMarkets = { ...DEFAULT_SELECTED_MARKETS };
				if (p?.selectedMarkets) {
					selectedMarkets = { ...selectedMarkets, ...p.selectedMarkets };
				} else if (p?.selectedMarket) {
					selectedMarkets = { ...selectedMarkets, all: p.selectedMarket, perp: p.selectedMarket };
				}

				return {
					...current,
					selectedMarkets,
					favoriteMarkets: Array.isArray(p?.favoriteMarkets) ? p.favoriteMarkets : current.favoriteMarkets,
				};
			},
		},
	),
);

export function useSelectedMarket(): string {
	const { scope } = useExchangeScope();
	return useMarketStore((state) => state.selectedMarkets[scope] ?? DEFAULT_MARKET_NAME);
}

export function useFavoriteMarkets() {
	return useMarketStore((state) => state.favoriteMarkets);
}

export function useMarketActions() {
	return useMarketStore((state) => state.actions);
}
