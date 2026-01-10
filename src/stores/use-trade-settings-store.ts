import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
	MARKET_ORDER_SLIPPAGE_MAX_BPS,
	MARKET_ORDER_SLIPPAGE_MIN_BPS,
	STORAGE_KEYS,
} from "@/config/interface";
import { clampInt } from "@/lib/trade/numbers";
import { createValidatedStorage } from "@/stores/validated-storage";

const tradeSettingsSchema = z.object({
	state: z.object({
		marketOrderSlippageBps: z.number().int().optional(),
	}),
});

const validatedStorage = createValidatedStorage(tradeSettingsSchema, "trade settings");

interface TradeSettingsStore {
	marketOrderSlippageBps: number;
	actions: {
		setMarketOrderSlippageBps: (bps: number) => void;
	};
}

const useTradeSettingsStore = create<TradeSettingsStore>()(
	persist(
		(set, get) => ({
			marketOrderSlippageBps: DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
			actions: {
				setMarketOrderSlippageBps: (bps) => {
					const next = clampInt(bps, MARKET_ORDER_SLIPPAGE_MIN_BPS, MARKET_ORDER_SLIPPAGE_MAX_BPS);
					if (get().marketOrderSlippageBps === next) return;
					set({ marketOrderSlippageBps: next });
				},
			},
		}),
		{
			name: STORAGE_KEYS.TRADE_SETTINGS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				marketOrderSlippageBps: state.marketOrderSlippageBps,
			}),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<TradeSettingsStore>),
				marketOrderSlippageBps: clampInt(
					(persisted as Partial<TradeSettingsStore>)?.marketOrderSlippageBps ?? DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
					MARKET_ORDER_SLIPPAGE_MIN_BPS,
					MARKET_ORDER_SLIPPAGE_MAX_BPS,
				),
			}),
		},
	),
);

export function useMarketOrderSlippageBps() {
	return useTradeSettingsStore((state) => state.marketOrderSlippageBps);
}

export function useTradeSettingsActions() {
	return useTradeSettingsStore((state) => state.actions);
}
