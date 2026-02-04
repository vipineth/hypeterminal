import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
	DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT,
	MARKET_ORDER_SLIPPAGE_MAX_PERCENT,
	MARKET_ORDER_SLIPPAGE_MIN_PERCENT,
	STORAGE_KEYS,
} from "@/config/constants";
import { type NumberFormatLocale, resolveNumberFormatLocale } from "@/lib/i18n";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { createValidatedStorage } from "@/stores/validated-storage";

const globalSettingsSchema = z.object({
	state: z.object({
		hideSmallBalances: z.boolean().optional(),
		showOrdersOnChart: z.boolean().optional(),
		showPositionsOnChart: z.boolean().optional(),
		showExecutionsOnChart: z.boolean().optional(),
		showOrderbookInQuote: z.boolean().optional(),
		showChartScanlines: z.boolean().optional(),
		numberFormatLocale: z.string().optional(),
		marketOrderSlippagePercent: z.number().optional(),
		marginMode: z.enum(["cross", "isolated"]).optional(),
		positionsActiveTab: z.string().optional(),
	}),
});

const validatedStorage = createValidatedStorage(globalSettingsSchema, "global settings");

const DEFAULT_GLOBAL_SETTINGS = {
	hideSmallBalances: true,
	showOrdersOnChart: true,
	showPositionsOnChart: true,
	showExecutionsOnChart: false,
	showOrderbookInQuote: false,
	showChartScanlines: true,
	numberFormatLocale: "auto" as NumberFormatLocale,
	marketOrderSlippagePercent: DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT,
	marginMode: "cross" as MarginMode,
	positionsActiveTab: "positions",
} as const;

interface GlobalSettingsStore {
	hideSmallBalances: boolean;
	showOrdersOnChart: boolean;
	showPositionsOnChart: boolean;
	showExecutionsOnChart: boolean;
	showOrderbookInQuote: boolean;
	showChartScanlines: boolean;
	numberFormatLocale: NumberFormatLocale;
	marketOrderSlippagePercent: number;
	marginMode: MarginMode;
	positionsActiveTab: string;
	actions: {
		setHideSmallBalances: (next: boolean) => void;
		setShowOrdersOnChart: (next: boolean) => void;
		setShowPositionsOnChart: (next: boolean) => void;
		setShowExecutionsOnChart: (next: boolean) => void;
		setShowOrderbookInQuote: (next: boolean) => void;
		setShowChartScanlines: (next: boolean) => void;
		setNumberFormatLocale: (next: NumberFormatLocale) => void;
		setMarketOrderSlippagePercent: (percent: number) => void;
		setMarginMode: (mode: MarginMode) => void;
		setPositionsActiveTab: (tab: string) => void;
	};
}

const useGlobalSettingsStore = create<GlobalSettingsStore>()(
	persist(
		(set, get) => ({
			...DEFAULT_GLOBAL_SETTINGS,
			actions: {
				setHideSmallBalances: (next) => set({ hideSmallBalances: next }),
				setShowOrdersOnChart: (next) => set({ showOrdersOnChart: next }),
				setShowPositionsOnChart: (next) => set({ showPositionsOnChart: next }),
				setShowExecutionsOnChart: (next) => set({ showExecutionsOnChart: next }),
				setShowOrderbookInQuote: (next) => set({ showOrderbookInQuote: next }),
				setShowChartScanlines: (next) => set({ showChartScanlines: next }),
				setNumberFormatLocale: (next) => set({ numberFormatLocale: next }),
				setMarketOrderSlippagePercent: (percent) => {
					const next = Math.min(
						Math.max(percent, MARKET_ORDER_SLIPPAGE_MIN_PERCENT),
						MARKET_ORDER_SLIPPAGE_MAX_PERCENT,
					);
					if (get().marketOrderSlippagePercent === next) return;
					set({ marketOrderSlippagePercent: next });
				},
				setMarginMode: (mode) => set({ marginMode: mode }),
				setPositionsActiveTab: (tab) => set({ positionsActiveTab: tab }),
			},
		}),
		{
			name: STORAGE_KEYS.GLOBAL_SETTINGS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				hideSmallBalances: state.hideSmallBalances,
				showOrdersOnChart: state.showOrdersOnChart,
				showPositionsOnChart: state.showPositionsOnChart,
				showExecutionsOnChart: state.showExecutionsOnChart,
				showOrderbookInQuote: state.showOrderbookInQuote,
				showChartScanlines: state.showChartScanlines,
				numberFormatLocale: state.numberFormatLocale,
				marketOrderSlippagePercent: state.marketOrderSlippagePercent,
				marginMode: state.marginMode,
				positionsActiveTab: state.positionsActiveTab,
			}),
			merge: (persisted, current) => {
				const p = persisted as Partial<GlobalSettingsStore>;
				const showOrderbookInQuote =
					typeof p.showOrderbookInQuote === "boolean"
						? p.showOrderbookInQuote
						: DEFAULT_GLOBAL_SETTINGS.showOrderbookInQuote;
				const slippagePercent = Math.min(
					Math.max(
						p?.marketOrderSlippagePercent ?? DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT,
						MARKET_ORDER_SLIPPAGE_MIN_PERCENT,
					),
					MARKET_ORDER_SLIPPAGE_MAX_PERCENT,
				);
				return {
					...current,
					...DEFAULT_GLOBAL_SETTINGS,
					...p,
					showOrderbookInQuote,
					marketOrderSlippagePercent: slippagePercent,
					marginMode: p?.marginMode === "isolated" ? "isolated" : "cross",
				};
			},
		},
	),
);

export function useGlobalSettings() {
	return useGlobalSettingsStore(
		useShallow((state) => ({
			hideSmallBalances: state.hideSmallBalances,
			showOrdersOnChart: state.showOrdersOnChart,
			showPositionsOnChart: state.showPositionsOnChart,
			showExecutionsOnChart: state.showExecutionsOnChart,
			showOrderbookInQuote: state.showOrderbookInQuote,
			showChartScanlines: state.showChartScanlines,
			numberFormatLocale: state.numberFormatLocale,
		})),
	);
}

export function useGlobalSettingsActions() {
	return useGlobalSettingsStore((state) => state.actions);
}

export function useMarketOrderSlippagePercent() {
	return useGlobalSettingsStore((state) => state.marketOrderSlippagePercent);
}

export function useMarketOrderSlippageBps() {
	return useGlobalSettingsStore((state) => state.marketOrderSlippagePercent * 100);
}

export function useMarginMode() {
	return useGlobalSettingsStore((state) => state.marginMode);
}

export function useResolvedFormatLocale(): string {
	const numberFormatLocale = useGlobalSettingsStore((state) => state.numberFormatLocale);
	return resolveNumberFormatLocale(numberFormatLocale);
}

export function getResolvedFormatLocale(): string {
	return resolveNumberFormatLocale(useGlobalSettingsStore.getState().numberFormatLocale);
}

export function useHideSmallBalances() {
	return useGlobalSettingsStore((state) => state.hideSmallBalances);
}

export function usePositionsActiveTab() {
	return useGlobalSettingsStore((state) => state.positionsActiveTab);
}
