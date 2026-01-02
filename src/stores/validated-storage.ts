import type { StateStorage } from "zustand/middleware";
import type { ZodSchema } from "zod";

const canUseLocalStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function createValidatedStorage<T>(schema: ZodSchema<T>, label: string): StateStorage {
	return {
		getItem: (name: string): string | null => {
			if (!canUseLocalStorage) return null;
			const item = localStorage.getItem(name);
			if (!item) return null;

			try {
				const parsed = JSON.parse(item);
				const validationResult = schema.safeParse(parsed);

				if (!validationResult.success) {
					console.warn(`Invalid ${label} data in localStorage, resetting:`, validationResult.error);
					localStorage.removeItem(name);
					return null;
				}

				return item;
			} catch (error) {
				console.warn(`Failed to parse ${label} from localStorage:`, error);
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
}
