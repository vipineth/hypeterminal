import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createValidatedStorage } from "@/stores/validated-storage";
import { TAP_TRADE_CONFIG } from "../constants";
import type { ActiveBet, BetAmount, MaxLeverage, PricePoint, TapAsset } from "../types";

// Schema for persisted settings
const tapTradeSettingsSchema = z.object({
	state: z.object({
		betAmount: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
		asset: z.union([z.literal("BTC"), z.literal("ETH"), z.literal("SOL")]).optional(),
		maxLeverage: z
			.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50), z.literal(100)])
			.optional(),
		hasSeenSettings: z.boolean().optional(),
	}),
});

const validatedStorage = createValidatedStorage(tapTradeSettingsSchema, "tap-trade settings");

interface TapTradeStore {
	// Settings
	betAmount: BetAmount;
	asset: TapAsset;
	maxLeverage: MaxLeverage;
	hasSeenSettings: boolean;

	// Runtime state
	currentPrice: number | null;
	priceHistory: PricePoint[];
	activeBets: ActiveBet[];
	highlightedBoxId: string | null;
	highlightTimeout: ReturnType<typeof setTimeout> | null;
	isSettingsOpen: boolean;

	// Actions
	actions: {
		setBetAmount: (amount: BetAmount) => void;
		setAsset: (asset: TapAsset) => void;
		setMaxLeverage: (leverage: MaxLeverage) => void;
		setHasSeenSettings: (seen: boolean) => void;
		setCurrentPrice: (price: number) => void;
		addPricePoint: (point: PricePoint) => void;
		setHighlightedBox: (boxId: string | null) => void;
		clearHighlightTimeout: () => void;
		setIsSettingsOpen: (open: boolean) => void;
		addActiveBet: (bet: ActiveBet) => void;
		removeActiveBet: (betId: string) => void;
		updateActiveBet: (betId: string, updates: Partial<ActiveBet>) => void;
	};
}

const useTapTradeStore = create<TapTradeStore>()(
	persist(
		(set, get) => ({
			// Default settings
			betAmount: TAP_TRADE_CONFIG.DEFAULT_BET,
			asset: TAP_TRADE_CONFIG.DEFAULT_ASSET,
			maxLeverage: TAP_TRADE_CONFIG.DEFAULT_MAX_LEVERAGE,
			hasSeenSettings: false,

			// Runtime state (not persisted)
			currentPrice: null,
			priceHistory: [],
			activeBets: [],
			highlightedBoxId: null,
			highlightTimeout: null,
			isSettingsOpen: false,

			actions: {
				setBetAmount: (amount) => set({ betAmount: amount }),
				setAsset: (asset) => set({ asset }),
				setMaxLeverage: (leverage) => set({ maxLeverage: leverage }),
				setHasSeenSettings: (seen) => set({ hasSeenSettings: seen }),

				setCurrentPrice: (price) => {
					const { priceHistory } = get();
					const now = Date.now();
					const cutoff = now - TAP_TRADE_CONFIG.PRICE_CHART_DURATION_MS;

					// Add new point and filter old ones
					const newHistory = [...priceHistory.filter((p) => p.timestamp > cutoff), { price, timestamp: now }];

					set({ currentPrice: price, priceHistory: newHistory });
				},

				addPricePoint: (point) => {
					const { priceHistory } = get();
					const cutoff = Date.now() - TAP_TRADE_CONFIG.PRICE_CHART_DURATION_MS;
					const newHistory = [...priceHistory.filter((p) => p.timestamp > cutoff), point];
					set({ priceHistory: newHistory });
				},

				setHighlightedBox: (boxId) => {
					const { highlightTimeout } = get();
					if (highlightTimeout) {
						clearTimeout(highlightTimeout);
					}

					if (boxId) {
						const timeout = setTimeout(() => {
							set({ highlightedBoxId: null, highlightTimeout: null });
						}, TAP_TRADE_CONFIG.DOUBLE_TAP_WINDOW_MS);
						set({ highlightedBoxId: boxId, highlightTimeout: timeout });
					} else {
						set({ highlightedBoxId: null, highlightTimeout: null });
					}
				},

				clearHighlightTimeout: () => {
					const { highlightTimeout } = get();
					if (highlightTimeout) {
						clearTimeout(highlightTimeout);
					}
					set({ highlightedBoxId: null, highlightTimeout: null });
				},

				setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),

				addActiveBet: (bet) => {
					set((state) => ({ activeBets: [...state.activeBets, bet] }));
				},

				removeActiveBet: (betId) => {
					set((state) => ({
						activeBets: state.activeBets.filter((b) => b.id !== betId),
					}));
				},

				updateActiveBet: (betId, updates) => {
					set((state) => ({
						activeBets: state.activeBets.map((b) => (b.id === betId ? { ...b, ...updates } : b)),
					}));
				},
			},
		}),
		{
			name: TAP_TRADE_CONFIG.STORAGE_KEY_SETTINGS,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				betAmount: state.betAmount,
				asset: state.asset,
				maxLeverage: state.maxLeverage,
				hasSeenSettings: state.hasSeenSettings,
			}),
			merge: (persisted, current) => ({
				...current,
				betAmount: TAP_TRADE_CONFIG.DEFAULT_BET,
				asset: TAP_TRADE_CONFIG.DEFAULT_ASSET,
				maxLeverage: TAP_TRADE_CONFIG.DEFAULT_MAX_LEVERAGE,
				hasSeenSettings: false,
				...(persisted as Partial<TapTradeStore>),
			}),
		}
	)
);

// Selectors
export function useTapTradeSettings() {
	return useTapTradeStore(
		useShallow((state) => ({
			betAmount: state.betAmount,
			asset: state.asset,
			maxLeverage: state.maxLeverage,
			hasSeenSettings: state.hasSeenSettings,
			isSettingsOpen: state.isSettingsOpen,
		}))
	);
}

export function useTapTradePrice() {
	return useTapTradeStore(
		useShallow((state) => ({
			currentPrice: state.currentPrice,
			priceHistory: state.priceHistory,
		}))
	);
}

export function useTapTradeBoxState() {
	return useTapTradeStore(
		useShallow((state) => ({
			highlightedBoxId: state.highlightedBoxId,
			activeBets: state.activeBets,
		}))
	);
}

export function useTapTradeActions() {
	return useTapTradeStore((state) => state.actions);
}
