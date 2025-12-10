import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

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

const useFavoritesStore = create<FavoritesStore>()(
	persist(
		(set) => ({
			favorites: [],
			actions: {
				toggleFavorite: (coin) => {
					return set((state) => ({
						favorites: state.favorites.includes(coin)
							? state.favorites.filter((f) => f !== coin)
							: [...state.favorites, coin],
					}));
				},
				addFavorite: (coin) => {
					return set((state) => ({
						favorites: state.favorites.includes(coin) ? state.favorites : [...state.favorites, coin],
					}));
				},
				removeFavorite: (coin) => {
					return set((state) => ({
						favorites: state.favorites.filter((f) => f !== coin),
					}));
				},
			},
		}),
		{
			name: "favorites-storage-v0.1",
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({ favorites: state.favorites }),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<FavoritesStore>),
			}),
		},
	),
);

export function useFavorites() {
	return useFavoritesStore((state) => state.favorites);
}

export function useFavoritesActions() {
	return useFavoritesStore((state) => state.actions);
}
