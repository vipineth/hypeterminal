import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type MarginMode = "cross" | "isolated";

const leverageByModeSchema = z.object({
	cross: z.number().int().positive().optional(),
	isolated: z.number().int().positive().optional(),
});

const tradeSettingsSchema = z.object({
	state: z.object({
		defaultLeverageByMode: leverageByModeSchema.optional(),
		marketLeverageByMode: z.record(z.string(), leverageByModeSchema).optional(),
		marketOrderSlippageBps: z.number().int().optional(),
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
			const validationResult = tradeSettingsSchema.safeParse(parsed);

			if (!validationResult.success) {
				console.warn("Invalid trade settings data in localStorage, resetting:", validationResult.error);
				localStorage.removeItem(name);
				return null;
			}

			return item;
		} catch (error) {
			console.warn("Failed to parse trade settings from localStorage:", error);
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

function clampInt(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, Math.round(value)));
}

const DEFAULT_DEFAULT_LEVERAGE_BY_MODE: Record<MarginMode, number> = {
	cross: 10,
	isolated: 10,
};

const DEFAULT_MARKET_ORDER_SLIPPAGE_BPS = 30;

interface TradeSettingsStore {
	defaultLeverageByMode: Record<MarginMode, number>;
	marketLeverageByMode: Record<string, Partial<Record<MarginMode, number>>>;
	marketOrderSlippageBps: number;
	actions: {
		setDefaultLeverage: (mode: MarginMode, leverage: number) => void;
		setMarketLeverage: (marketKey: string, mode: MarginMode, leverage: number, maxLeverage?: number) => void;
		clearMarketLeverage: (marketKey: string, mode?: MarginMode) => void;
		setMarketOrderSlippageBps: (bps: number) => void;
	};
}

const useTradeSettingsStore = create<TradeSettingsStore>()(
	persist(
		(set, get) => ({
			defaultLeverageByMode: DEFAULT_DEFAULT_LEVERAGE_BY_MODE,
			marketLeverageByMode: {},
			marketOrderSlippageBps: DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
			actions: {
				setDefaultLeverage: (mode, leverage) => {
					const next = clampInt(leverage, 1, 100);
					set((state) => ({
						defaultLeverageByMode: { ...state.defaultLeverageByMode, [mode]: next },
					}));
				},
				setMarketLeverage: (marketKey, mode, leverage, maxLeverage) => {
					const max = typeof maxLeverage === "number" && Number.isFinite(maxLeverage) ? Math.max(1, maxLeverage) : 100;
					const next = clampInt(leverage, 1, max);
					set((state) => ({
						marketLeverageByMode: {
							...state.marketLeverageByMode,
							[marketKey]: { ...(state.marketLeverageByMode[marketKey] ?? {}), [mode]: next },
						},
					}));
				},
				clearMarketLeverage: (marketKey, mode) => {
					const existing = get().marketLeverageByMode[marketKey];
					if (!existing) return;

					if (!mode) {
						set((state) => {
							const { [marketKey]: _, ...rest } = state.marketLeverageByMode;
							return { marketLeverageByMode: rest };
						});
						return;
					}

					set((state) => {
						const nextEntry = { ...(state.marketLeverageByMode[marketKey] ?? {}) };
						delete nextEntry[mode];

						if (Object.keys(nextEntry).length === 0) {
							const { [marketKey]: _, ...rest } = state.marketLeverageByMode;
							return { marketLeverageByMode: rest };
						}

						return {
							marketLeverageByMode: { ...state.marketLeverageByMode, [marketKey]: nextEntry },
						};
					});
				},
				setMarketOrderSlippageBps: (bps) => {
					set({ marketOrderSlippageBps: clampInt(bps, 20, 50) });
				},
			},
		}),
		{
			name: "trade-settings-v1",
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				defaultLeverageByMode: state.defaultLeverageByMode,
				marketLeverageByMode: state.marketLeverageByMode,
				marketOrderSlippageBps: state.marketOrderSlippageBps,
			}),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<TradeSettingsStore>),
				defaultLeverageByMode: {
					...DEFAULT_DEFAULT_LEVERAGE_BY_MODE,
					...((persisted as Partial<TradeSettingsStore>)?.defaultLeverageByMode ?? {}),
				},
				marketOrderSlippageBps: clampInt(
					(persisted as Partial<TradeSettingsStore>)?.marketOrderSlippageBps ?? DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
					20,
					50,
				),
			}),
		},
	),
);

export function useDefaultLeverageByMode() {
	return useTradeSettingsStore((state) => state.defaultLeverageByMode);
}

export function useMarketLeverageByMode() {
	return useTradeSettingsStore((state) => state.marketLeverageByMode);
}

export function useMarketOrderSlippageBps() {
	return useTradeSettingsStore((state) => state.marketOrderSlippageBps);
}

export function useTradeSettingsActions() {
	return useTradeSettingsStore((state) => state.actions);
}

