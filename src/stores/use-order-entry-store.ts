import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/config/constants";
import { createValidatedStorage } from "@/stores/validated-storage";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";
type SizeMode = "asset" | "usd";

const orderEntrySchema = z.object({
	state: z.object({
		side: z.enum(["buy", "sell"]).optional(),
		orderType: z.enum(["market", "limit"]).optional(),
		sizeMode: z.enum(["asset", "usd"]).optional(),
		reduceOnly: z.boolean().optional(),
	}),
});

const validatedStorage = createValidatedStorage(orderEntrySchema, "order entry");

const DEFAULT_ORDER_ENTRY = {
	side: "buy" as Side,
	orderType: "market" as OrderType,
	sizeMode: "asset" as SizeMode,
	reduceOnly: false,
} as const;

interface OrderEntryState {
	side: Side;
	orderType: OrderType;
	sizeMode: SizeMode;
	reduceOnly: boolean;
}

interface OrderEntryActions {
	setSide: (side: Side) => void;
	setOrderType: (type: OrderType) => void;
	setSizeMode: (mode: SizeMode) => void;
	toggleSizeMode: () => void;
	setReduceOnly: (value: boolean) => void;
}

interface OrderEntryStore extends OrderEntryState {
	actions: OrderEntryActions;
}

const useOrderEntryStore = create<OrderEntryStore>()(
	persist(
		(set) => ({
			...DEFAULT_ORDER_ENTRY,
			actions: {
				setSide: (side) => set({ side }),
				setOrderType: (orderType) => set({ orderType }),
				setSizeMode: (sizeMode) => set({ sizeMode }),
				toggleSizeMode: () => set((state) => ({ sizeMode: state.sizeMode === "asset" ? "usd" : "asset" })),
				setReduceOnly: (reduceOnly) => set({ reduceOnly }),
			},
		}),
		{
			name: STORAGE_KEYS.ORDER_ENTRY,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({
				side: state.side,
				orderType: state.orderType,
				sizeMode: state.sizeMode,
			}),
			merge: (persisted, current) => ({
				...current,
				...DEFAULT_ORDER_ENTRY,
				...(persisted as Partial<OrderEntryState>),
			}),
		},
	),
);

export const useOrderSide = () => useOrderEntryStore((s) => s.side);
export const useOrderType = () => useOrderEntryStore((s) => s.orderType);
export const useSizeMode = () => useOrderEntryStore((s) => s.sizeMode);
export const useReduceOnly = () => useOrderEntryStore((s) => s.reduceOnly);

export const useOrderEntryActions = () => useOrderEntryStore((s) => s.actions);
