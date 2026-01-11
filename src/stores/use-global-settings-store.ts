import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
	DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
	MARKET_ORDER_SLIPPAGE_MAX_BPS,
	MARKET_ORDER_SLIPPAGE_MIN_BPS,
	STORAGE_KEYS,
} from "@/config/constants";
import { type NumberFormatLocale, resolveNumberFormatLocale } from "@/lib/i18n";
import { clampInt } from "@/lib/trade/numbers";
import { createValidatedStorage } from "@/stores/validated-storage";

const globalSettingsSchema = z.object({
	state: z.object({
		showOrdersOnChart: z.boolean().optional(),
		showPositionsOnChart: z.boolean().optional(),
		showExecutionsOnChart: z.boolean().optional(),
		showOrderbookInUsd: z.boolean().optional(),
		showChartScanlines: z.boolean().optional(),
		numberFormatLocale: z.string().optional(),
		marketOrderSlippageBps: z.number().int().optional(),
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
	marketOrderSlippageBps: DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
} as const;

interface GlobalSettingsStore {
	showOrdersOnChart: boolean;
	showPositionsOnChart: boolean;
	showExecutionsOnChart: boolean;
	showOrderbookInUsd: boolean;
	showChartScanlines: boolean;
	numberFormatLocale: NumberFormatLocale;
	marketOrderSlippageBps: number;
	actions: {
		setShowOrdersOnChart: (next: boolean) => void;
		setShowPositionsOnChart: (next: boolean) => void;
		setShowExecutionsOnChart: (next: boolean) => void;
		setShowOrderbookInUsd: (next: boolean) => void;
		setShowChartScanlines: (next: boolean) => void;
		setNumberFormatLocale: (next: NumberFormatLocale) => void;
		setMarketOrderSlippageBps: (bps: number) => void;
	};
}

const useGlobalSettingsStore = create<GlobalSettingsStore>()(
	persist(
		(set, get) => ({
			...DEFAULT_GLOBAL_SETTINGS,
			actions: {
				setShowOrdersOnChart: (next) => set({ showOrdersOnChart: next }),
				setShowPositionsOnChart: (next) => set({ showPositionsOnChart: next }),
				setShowExecutionsOnChart: (next) => set({ showExecutionsOnChart: next }),
				setShowOrderbookInUsd: (next) => set({ showOrderbookInUsd: next }),
				setShowChartScanlines: (next) => set({ showChartScanlines: next }),
				setNumberFormatLocale: (next) => set({ numberFormatLocale: next }),
				setMarketOrderSlippageBps: (bps) => {
					const next = clampInt(bps, MARKET_ORDER_SLIPPAGE_MIN_BPS, MARKET_ORDER_SLIPPAGE_MAX_BPS);
					if (get().marketOrderSlippageBps === next) return;
					set({ marketOrderSlippageBps: next });
				},
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
				marketOrderSlippageBps: state.marketOrderSlippageBps,
			}),
			merge: (persisted, current) => {
				const p = persisted as Partial<GlobalSettingsStore>;
				return {
					...current,
					...DEFAULT_GLOBAL_SETTINGS,
					...p,
					marketOrderSlippageBps: clampInt(
						p?.marketOrderSlippageBps ?? DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
						MARKET_ORDER_SLIPPAGE_MIN_BPS,
						MARKET_ORDER_SLIPPAGE_MAX_BPS,
					),
				};
			},
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

export function useMarketOrderSlippageBps() {
	return useGlobalSettingsStore((state) => state.marketOrderSlippageBps);
}

export function useResolvedFormatLocale(): string {
	const numberFormatLocale = useGlobalSettingsStore((state) => state.numberFormatLocale);
	return resolveNumberFormatLocale(numberFormatLocale);
}

export function getResolvedFormatLocale(): string {
	return resolveNumberFormatLocale(useGlobalSettingsStore.getState().numberFormatLocale);
}
