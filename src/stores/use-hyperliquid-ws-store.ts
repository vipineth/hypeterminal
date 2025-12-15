import { create } from "zustand";
import { createSelectors } from "./create-selectors";

export type HyperliquidWsStatus = "idle" | "subscribing" | "subscribed" | "error";

export interface HyperliquidWsEntry {
	data?: unknown;
	status: HyperliquidWsStatus;
	error?: unknown;
	failureSignal?: AbortSignal;
}

interface HyperliquidWsState {
	entries: Record<string, HyperliquidWsEntry>;
}

interface HyperliquidWsActions {
	setEntry: (key: string, patch: Partial<HyperliquidWsEntry>) => void;
	setData: (key: string, value: unknown) => void;
	clear: (key: string) => void;
	reset: () => void;
}

interface HyperliquidWsStore extends HyperliquidWsState {
	actions: HyperliquidWsActions;
}

const initialState: HyperliquidWsState = {
	entries: {},
};

const useHyperliquidWsStoreBase = create<HyperliquidWsStore>((set) => ({
	...initialState,
	actions: {
		setEntry: (key, patch) => {
			set((state) => ({
				entries: {
					...state.entries,
					[key]: {
						...(state.entries[key] ?? { status: "idle" }),
						...patch,
					},
				},
			}));
		},
		setData: (key, value) => {
			set((state) => ({
				entries: {
					...state.entries,
					[key]: {
						...(state.entries[key] ?? { status: "idle" }),
						data: value,
					},
				},
			}));
		},
		clear: (key) => {
			set((state) => {
				const { [key]: _, ...rest } = state.entries;
				return { entries: rest };
			});
		},
		reset: () => {
			set(initialState);
		},
	},
}));

export const useHyperliquidWsStore = createSelectors(useHyperliquidWsStoreBase);
