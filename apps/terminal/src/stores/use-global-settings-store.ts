import { i18n } from "@lingui/core";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { STORAGE_KEYS } from "@/config/app";
import { type LocaleCode, type NumberFormatLocale, resolveNumberFormatLocale } from "@/config/i18n";
import { DEFAULT_MOBILE_TAB, type MobileTab, parseMobileTab } from "@/config/nav";
import {
	DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT,
	MARKET_ORDER_SLIPPAGE_MAX_PERCENT,
	MARKET_ORDER_SLIPPAGE_MIN_PERCENT,
} from "@/config/trade";
import type { Network } from "@/lib/network";
import { createValidatedStorage } from "@/lib/storage/validated-storage";
import type { MarginMode } from "@/lib/trade/margin-mode";

type Theme = "dark" | "light";

const globalSettingsSchema = z.object({
	state: z.object({
		hideSmallBalances: z.boolean().optional(),
		showOrderbookInQuote: z.boolean().optional(),
		showChartScanlines: z.boolean().optional(),
		numberFormatLocale: z.string().optional(),
		marketOrderSlippagePercent: z.number().optional(),
		marginMode: z.enum(["cross", "isolated"]).optional(),
		positionsActiveTab: z.string().optional(),
		mobileActiveTab: z.string().optional(),
		mobileMarketOpen: z.boolean().optional(),
		theme: z.enum(["dark", "light"]).optional(),
		network: z.enum(["mainnet", "testnet"]).optional(),
	}),
});

const validatedStorage = createValidatedStorage(globalSettingsSchema, "global settings");

const DEFAULT_GLOBAL_SETTINGS = {
	hideSmallBalances: true,
	showOrderbookInQuote: false,
	showChartScanlines: false,
	numberFormatLocale: "auto" as NumberFormatLocale,
	marketOrderSlippagePercent: DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT,
	marginMode: "cross" as MarginMode,
	positionsActiveTab: "positions",
	mobileActiveTab: DEFAULT_MOBILE_TAB,
	mobileMarketOpen: true,
	theme: "dark" as Theme,
	network: "mainnet" as Network,
} as const;

interface GlobalSettingsStore {
	hideSmallBalances: boolean;
	showOrderbookInQuote: boolean;
	showChartScanlines: boolean;
	numberFormatLocale: NumberFormatLocale;
	marketOrderSlippagePercent: number;
	marginMode: MarginMode;
	positionsActiveTab: string;
	mobileActiveTab: MobileTab;
	mobileMarketOpen: boolean;
	theme: Theme;
	network: Network;
	actions: {
		setHideSmallBalances: (next: boolean) => void;
		setShowOrderbookInQuote: (next: boolean) => void;
		setShowChartScanlines: (next: boolean) => void;
		setNumberFormatLocale: (next: NumberFormatLocale) => void;
		setMarketOrderSlippagePercent: (percent: number) => void;
		setMarginMode: (mode: MarginMode) => void;
		setPositionsActiveTab: (tab: string) => void;
		setMobileActiveTab: (tab: MobileTab) => void;
		setMobileMarketOpen: (open: boolean) => void;
		setTheme: (theme: Theme) => void;
		setNetwork: (network: Network) => void;
	};
}

const useGlobalSettingsStore = create<GlobalSettingsStore>()(
	persist(
		(set, get) => ({
			...DEFAULT_GLOBAL_SETTINGS,
			actions: {
				setHideSmallBalances: (next) => set({ hideSmallBalances: next }),
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
				setMobileActiveTab: (tab) => set({ mobileActiveTab: tab, mobileMarketOpen: false }),
				setMobileMarketOpen: (open) => set({ mobileMarketOpen: open }),
				setTheme: (theme) => set({ theme }),
				setNetwork: (network) => {
					set({ network });
					if (typeof window !== "undefined") window.location.reload();
				},
			},
		}),
		{
			name: STORAGE_KEYS.GLOBAL_SETTINGS,
			version: 2,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				hideSmallBalances: state.hideSmallBalances,
				showOrderbookInQuote: state.showOrderbookInQuote,
				showChartScanlines: state.showChartScanlines,
				numberFormatLocale: state.numberFormatLocale,
				marketOrderSlippagePercent: state.marketOrderSlippagePercent,
				marginMode: state.marginMode,
				positionsActiveTab: state.positionsActiveTab,
				mobileActiveTab: state.mobileActiveTab,
				mobileMarketOpen: state.mobileMarketOpen,
				theme: state.theme,
				network: state.network,
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
					mobileActiveTab: parseMobileTab(p?.mobileActiveTab ?? DEFAULT_MOBILE_TAB),
					theme: p?.theme === "light" ? "light" : "dark",
					network: p?.network === "testnet" ? "testnet" : "mainnet",
				};
			},
		},
	),
);

function applyThemeClass(theme: Theme) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(theme);
}

applyThemeClass(useGlobalSettingsStore.getState().theme);
useGlobalSettingsStore.subscribe((state, prev) => {
	if (state.theme !== prev.theme) applyThemeClass(state.theme);
});

export function useTheme() {
	return useGlobalSettingsStore((state) => state.theme);
}

export function useSetTheme() {
	return useGlobalSettingsStore((state) => state.actions.setTheme);
}

export function useGlobalSettings() {
	return useGlobalSettingsStore(
		useShallow((state) => ({
			hideSmallBalances: state.hideSmallBalances,
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

export function getResolvedFormatLocale(): string {
	return resolveNumberFormatLocale(useGlobalSettingsStore.getState().numberFormatLocale, i18n.locale as LocaleCode);
}

export function useHideSmallBalances() {
	return useGlobalSettingsStore((state) => state.hideSmallBalances);
}

export function usePositionsActiveTab() {
	return useGlobalSettingsStore((state) => state.positionsActiveTab);
}

export function useMobileActiveTab(): MobileTab {
	return useGlobalSettingsStore((state) => state.mobileActiveTab);
}

export function useMobileMarketOpen() {
	return useGlobalSettingsStore((state) => state.mobileMarketOpen);
}

export function useNetwork() {
	return useGlobalSettingsStore((state) => state.network);
}

export function useIsTestnet() {
	return useGlobalSettingsStore((state) => state.network === "testnet");
}
