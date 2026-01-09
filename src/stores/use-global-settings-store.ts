import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { STORAGE_KEYS } from "@/config/interface";
import { type NumberFormatLocale, resolveNumberFormatLocale } from "@/lib/i18n";
import { createValidatedStorage } from "@/stores/validated-storage";

const globalSettingsSchema = z.object({
	state: z.object({
		showOrdersOnChart: z.boolean().optional(),
		showPositionsOnChart: z.boolean().optional(),
		showExecutionsOnChart: z.boolean().optional(),
		showOrderbookInUsd: z.boolean().optional(),
		showChartScanlines: z.boolean().optional(),
		numberFormatLocale: z.string().optional(),
	}),
});

const validatedStorage = createValidatedStorage(globalSettingsSchema, "global settings");

const DEFAULT_GLOBAL_SETTINGS = {
	showOrdersOnChart: true,
	showPositionsOnChart: true,
	showExecutionsOnChart: false,
	showOrderbookInUsd: false,
	showChartScanlines: true,
	numberFormatLocale: "auto" as NumberFormatLocale,
} as const;

interface GlobalSettingsStore {
	showOrdersOnChart: boolean;
	showPositionsOnChart: boolean;
	showExecutionsOnChart: boolean;
	showOrderbookInUsd: boolean;
	showChartScanlines: boolean;
	numberFormatLocale: NumberFormatLocale;
	actions: {
		setShowOrdersOnChart: (next: boolean) => void;
		setShowPositionsOnChart: (next: boolean) => void;
		setShowExecutionsOnChart: (next: boolean) => void;
		setShowOrderbookInUsd: (next: boolean) => void;
		setShowChartScanlines: (next: boolean) => void;
		setNumberFormatLocale: (next: NumberFormatLocale) => void;
	};
}

const useGlobalSettingsStore = create<GlobalSettingsStore>()(
	persist(
		(set) => ({
			...DEFAULT_GLOBAL_SETTINGS,
			actions: {
				setShowOrdersOnChart: (next) => set({ showOrdersOnChart: next }),
				setShowPositionsOnChart: (next) => set({ showPositionsOnChart: next }),
				setShowExecutionsOnChart: (next) => set({ showExecutionsOnChart: next }),
				setShowOrderbookInUsd: (next) => set({ showOrderbookInUsd: next }),
				setShowChartScanlines: (next) => set({ showChartScanlines: next }),
				setNumberFormatLocale: (next) => set({ numberFormatLocale: next }),
			},
		}),
		{
			name: STORAGE_KEYS.GLOBAL_SETTINGS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				showOrdersOnChart: state.showOrdersOnChart,
				showPositionsOnChart: state.showPositionsOnChart,
				showExecutionsOnChart: state.showExecutionsOnChart,
				showOrderbookInUsd: state.showOrderbookInUsd,
				showChartScanlines: state.showChartScanlines,
				numberFormatLocale: state.numberFormatLocale,
			}),
			merge: (persisted, current) => ({
				...current,
				...DEFAULT_GLOBAL_SETTINGS,
				...(persisted as Partial<GlobalSettingsStore>),
			}),
		},
	),
);

export function useGlobalSettings() {
	return useGlobalSettingsStore(
		useShallow((state) => ({
			showOrdersOnChart: state.showOrdersOnChart,
			showPositionsOnChart: state.showPositionsOnChart,
			showExecutionsOnChart: state.showExecutionsOnChart,
			showOrderbookInUsd: state.showOrderbookInUsd,
			showChartScanlines: state.showChartScanlines,
			numberFormatLocale: state.numberFormatLocale,
		})),
	);
}

export function useGlobalSettingsActions() {
	return useGlobalSettingsStore((state) => state.actions);
}

/**
 * Returns the resolved Intl locale string for number/date formatting.
 * Use this when you need the actual locale code (e.g., "en-US", "de-DE").
 */
export function useResolvedFormatLocale(): string {
	const numberFormatLocale = useGlobalSettingsStore((state) => state.numberFormatLocale);
	return resolveNumberFormatLocale(numberFormatLocale);
}

/**
 * Get the resolved format locale synchronously (for non-React contexts).
 * Prefer useResolvedFormatLocale() in React components for reactivity.
 */
export function getResolvedFormatLocale(): string {
	return resolveNumberFormatLocale(useGlobalSettingsStore.getState().numberFormatLocale);
}
