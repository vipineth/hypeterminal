import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_MARKET_NAME } from "@/config/constants";
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
			name: "market-prefs-v3",
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

export function useSetSelectedMarket(): (marketName: string) => void {
	const { scope } = useExchangeScope();
	const setSelectedMarket = useMarketStore((state) => state.actions.setSelectedMarket);
	return (marketName: string) => setSelectedMarket(scope, marketName);
}

export function useFavoriteMarkets() {
	return useMarketStore((state) => state.favoriteMarkets);
}

export function useMarketActions() {
	const { scope } = useExchangeScope();
	const actions = useMarketStore((state) => state.actions);
	return {
		setSelectedMarket: (marketName: string) => actions.setSelectedMarket(scope, marketName),
		toggleFavoriteMarket: actions.toggleFavoriteMarket,
	};
}
