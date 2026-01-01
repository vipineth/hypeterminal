import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type MarketScope = "all" | "perp" | "spot" | "builderPerp";

const marketPrefsSchema = z.object({
	state: z.object({
		marketScope: z.enum(["all", "perp", "spot", "builderPerp"]).optional(),
		selectedMarketKey: z.string().optional(),
		lastSelectedByScope: z
			.record(z.enum(["all", "perp", "spot", "builderPerp"]), z.string())
			.optional(),
		favoriteMarketKeys: z.array(z.string()).optional(),
	}),
});

const canUseLocalStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const validatedStorage: StateStorage = {
	getItem: (name: string): string | null => {
		if (!canUseLocalStorage) return null;
		const item = localStorage.getItem(name);
		if (!item) return null;

		try {
			const parsed = JSON.parse(item);
			const validationResult = marketPrefsSchema.safeParse(parsed);

			if (!validationResult.success) {
				console.warn("Invalid market prefs data in localStorage, resetting:", validationResult.error);
				localStorage.removeItem(name);
				return null;
			}

			return item;
		} catch (error) {
			console.warn("Failed to parse market prefs from localStorage:", error);
			localStorage.removeItem(name);
			return null;
		}
	},
	setItem: (name: string, value: string): void => {
		if (!canUseLocalStorage) return;
		localStorage.setItem(name, value);
	},
	removeItem: (name: string): void => {
		if (!canUseLocalStorage) return;
		localStorage.removeItem(name);
	},
};

const DEFAULT_MARKET_KEY = "perp:BTC";

function defaultLastSelectedByScope(): Record<MarketScope, string> {
	return {
		all: DEFAULT_MARKET_KEY,
		perp: DEFAULT_MARKET_KEY,
		spot: DEFAULT_MARKET_KEY,
		builderPerp: DEFAULT_MARKET_KEY,
	};
}

interface MarketPrefsStore {
	marketScope: MarketScope;
	selectedMarketKey: string;
	lastSelectedByScope: Record<MarketScope, string>;
	favoriteMarketKeys: string[];
	actions: {
		setMarketScope: (scope: MarketScope) => void;
		setSelectedMarketKey: (marketKey: string) => void;
		toggleFavoriteMarketKey: (marketKey: string) => void;
		addFavoriteMarketKey: (marketKey: string) => void;
		removeFavoriteMarketKey: (marketKey: string) => void;
		setFavoriteMarketKeys: (marketKeys: string[]) => void;
	};
}

const useMarketPrefsStore = create<MarketPrefsStore>()(
	persist(
		(set, get) => ({
			marketScope: "perp",
			selectedMarketKey: DEFAULT_MARKET_KEY,
			lastSelectedByScope: defaultLastSelectedByScope(),
			favoriteMarketKeys: [],
			actions: {
				setMarketScope: (scope) => {
					set((state) => ({
						marketScope: scope,
						selectedMarketKey: state.lastSelectedByScope[scope] ?? state.selectedMarketKey,
					}));
				},
				setSelectedMarketKey: (marketKey) => {
					set((state) => ({
						selectedMarketKey: marketKey,
						lastSelectedByScope: {
							...state.lastSelectedByScope,
							[state.marketScope]: marketKey,
						},
					}));
				},
				toggleFavoriteMarketKey: (marketKey) => {
					set((state) => ({
						favoriteMarketKeys: state.favoriteMarketKeys.includes(marketKey)
							? state.favoriteMarketKeys.filter((k) => k !== marketKey)
							: [...state.favoriteMarketKeys, marketKey],
					}));
				},
				addFavoriteMarketKey: (marketKey) => {
					const existing = get().favoriteMarketKeys;
					if (existing.includes(marketKey)) return;
					set({ favoriteMarketKeys: [...existing, marketKey] });
				},
				removeFavoriteMarketKey: (marketKey) => {
					set((state) => ({
						favoriteMarketKeys: state.favoriteMarketKeys.filter((k) => k !== marketKey),
					}));
				},
				setFavoriteMarketKeys: (marketKeys) => {
					set({ favoriteMarketKeys: marketKeys });
				},
			},
		}),
		{
			name: "market-prefs-v1",
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				marketScope: state.marketScope,
				selectedMarketKey: state.selectedMarketKey,
				lastSelectedByScope: state.lastSelectedByScope,
				favoriteMarketKeys: state.favoriteMarketKeys,
			}),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<MarketPrefsStore>),
				lastSelectedByScope: {
					...defaultLastSelectedByScope(),
					...((persisted as Partial<MarketPrefsStore>)?.lastSelectedByScope ?? {}),
				},
			}),
		},
	),
);

export function useMarketScope() {
	return useMarketPrefsStore((state) => state.marketScope);
}

export function useSelectedMarketKey() {
	return useMarketPrefsStore((state) => state.selectedMarketKey);
}

export function useFavoriteMarketKeys() {
	return useMarketPrefsStore((state) => state.favoriteMarketKeys);
}

export function useMarketPrefsActions() {
	return useMarketPrefsStore((state) => state.actions);
}
