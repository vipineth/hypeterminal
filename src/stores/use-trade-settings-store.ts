import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	DEFAULT_LEVERAGE_BY_MODE,
	DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
	MARKET_LEVERAGE_HARD_MAX,
	MARKET_ORDER_SLIPPAGE_MAX_BPS,
	MARKET_ORDER_SLIPPAGE_MIN_BPS,
	STORAGE_KEYS,
} from "@/constants/app";
import { clampInt } from "@/lib/trade/numbers";
import { createValidatedStorage } from "@/stores/validated-storage";

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

const validatedStorage = createValidatedStorage(tradeSettingsSchema, "trade settings");

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
			defaultLeverageByMode: DEFAULT_LEVERAGE_BY_MODE,
			marketLeverageByMode: {},
			marketOrderSlippageBps: DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
			actions: {
				setDefaultLeverage: (mode, leverage) => {
					const next = clampInt(leverage, 1, MARKET_LEVERAGE_HARD_MAX);
					set((state) => ({
						defaultLeverageByMode: { ...state.defaultLeverageByMode, [mode]: next },
					}));
				},
				setMarketLeverage: (marketKey, mode, leverage, maxLeverage) => {
					const max =
						typeof maxLeverage === "number" && Number.isFinite(maxLeverage)
							? Math.max(1, maxLeverage)
							: MARKET_LEVERAGE_HARD_MAX;
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
					set({ marketOrderSlippageBps: clampInt(bps, MARKET_ORDER_SLIPPAGE_MIN_BPS, MARKET_ORDER_SLIPPAGE_MAX_BPS) });
				},
			},
		}),
		{
			name: STORAGE_KEYS.TRADE_SETTINGS,
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
					...DEFAULT_LEVERAGE_BY_MODE,
					...((persisted as Partial<TradeSettingsStore>)?.defaultLeverageByMode ?? {}),
				},
				marketOrderSlippageBps: clampInt(
					(persisted as Partial<TradeSettingsStore>)?.marketOrderSlippageBps ?? DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
					MARKET_ORDER_SLIPPAGE_MIN_BPS,
					MARKET_ORDER_SLIPPAGE_MAX_BPS,
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
