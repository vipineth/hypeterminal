import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { z } from "zod";

const validatedStorage: StateStorage = {
	getItem: (name: string): string | null => {
		const item = localStorage.getItem(name);
		if (!item) return null;

		try {
			const parsed = JSON.parse(item);
			const validationResult = z
				.object({
					state: z.object({
						favorites: z.array(z.string()),
					}),
				})
				.safeParse(parsed);

			if (!validationResult.success) {
				console.warn("Invalid favorites data in localStorage, resetting:", validationResult.error);
				localStorage.removeItem(name);
				return null;
			}

			return item;
		} catch (error) {
			console.warn("Failed to parse favorites from localStorage:", error);
			localStorage.removeItem(name);
			return null;
		}
	},
	setItem: (name: string, value: string): void => {
		localStorage.setItem(name, value);
	},
	removeItem: (name: string): void => {
		localStorage.removeItem(name);
	},
};

interface FavoritesStore {
	favorites: string[];
	actions: {
		toggleFavorite: (coin: string) => void;
		addFavorite: (coin: string) => void;
		removeFavorite: (coin: string) => void;
	};
}

// ⬇️ not exported - prevents subscribing to entire store
const useFavoritesStore = create<FavoritesStore>()(
	persist(
		(set) => ({
			favorites: [],
			actions: {
				toggleFavorite: (coin) =>
					set((state) => ({
						favorites: state.favorites.includes(coin)
							? state.favorites.filter((f) => f !== coin)
							: [...state.favorites, coin],
					})),
				addFavorite: (coin) =>
					set((state) => ({
						favorites: state.favorites.includes(coin)
							? state.favorites
							: [...state.favorites, coin],
					})),
				removeFavorite: (coin) =>
					set((state) => ({
						favorites: state.favorites.filter((f) => f !== coin),
					})),
			},
		}),
		{
			name: "favorites-storage",
			storage: createJSONStorage(() => validatedStorage),
		},
	),
);

// 💡 exported - atomic selectors using function declarations
export function useFavorites() {
	return useFavoritesStore((state) => state.favorites);
}

export function useFavoritesActions() {
	return useFavoritesStore((state) => state.actions);
}
