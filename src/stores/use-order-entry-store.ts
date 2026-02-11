import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";
import { STORAGE_KEYS } from "@/config/constants";
import {
	isScaleOrderType,
	isTriggerOrderType,
	type LimitTif,
	ORDER_TYPES,
	type OrderType,
} from "@/lib/trade/order-types";
import type { Side, SizeMode } from "@/lib/trade/types";
import { createValidatedStorage } from "@/stores/validated-storage";

interface PersistedState {
	side: Side;
	orderType: OrderType;
	sizeMode: SizeMode;
}

interface FormState {
	size: string;
	limitPrice: string;
	triggerPrice: string;
	scaleStart: string;
	scaleEnd: string;
	scaleLevels: number;
	twapMinutes: number;
	twapRandomize: boolean;
	reduceOnly: boolean;
	tpSlEnabled: boolean;
	tpPrice: string;
	slPrice: string;
	tif: LimitTif;
}

interface OrderEntryState extends PersistedState, FormState {}

interface OrderEntryActions {
	setSide: (side: Side) => void;
	setOrderType: (orderType: OrderType) => void;
	setSizeMode: (mode: SizeMode) => void;
	toggleSizeMode: () => void;

	setSize: (size: string) => void;
	setLimitPrice: (price: string) => void;
	setTriggerPrice: (price: string) => void;
	setScaleStart: (price: string) => void;
	setScaleEnd: (price: string) => void;
	setScaleLevels: (levels: number) => void;
	setTwapMinutes: (minutes: number) => void;
	setTwapRandomize: (randomize: boolean) => void;
	setReduceOnly: (reduceOnly: boolean) => void;
	setTpSlEnabled: (enabled: boolean) => void;
	setTpPrice: (price: string) => void;
	setSlPrice: (price: string) => void;
	setTif: (tif: LimitTif) => void;

	resetForm: () => void;
	resetPrices: () => void;
}

interface OrderEntryStore extends OrderEntryState {
	actions: OrderEntryActions;
}

const DEFAULT_PERSISTED: PersistedState = {
	side: "buy",
	orderType: "market",
	sizeMode: "base",
};

const DEFAULT_FORM: FormState = {
	size: "",
	limitPrice: "",
	triggerPrice: "",
	scaleStart: "",
	scaleEnd: "",
	scaleLevels: 4,
	twapMinutes: 30,
	twapRandomize: true,
	reduceOnly: false,
	tpSlEnabled: false,
	tpPrice: "",
	slPrice: "",
	tif: "Gtc",
};

const orderEntrySchema = z.object({
	state: z.object({
		side: z.enum(["buy", "sell"]).optional(),
		orderType: z.enum(ORDER_TYPES).optional(),
		sizeMode: z.enum(["base", "quote"]).optional(),
	}),
});

const validatedStorage = createValidatedStorage(orderEntrySchema, "order entry");

const useOrderEntryStore = create<OrderEntryStore>()(
	subscribeWithSelector(
		persist(
			(set) => ({
				...DEFAULT_PERSISTED,
				...DEFAULT_FORM,

				actions: {
					setSide: (side) => set({ side }),

					setOrderType: (orderType) => {
						const isTrigger = isTriggerOrderType(orderType);
						const isScale = isScaleOrderType(orderType);
						set((state) => {
							const needsTifReset = isScale && state.tif === "Ioc";
							return {
								orderType,
								reduceOnly: isTrigger ? true : state.reduceOnly,
								tpSlEnabled: isTrigger ? false : state.tpSlEnabled,
								tif: needsTifReset ? "Gtc" : state.tif,
							};
						});
					},

					setSizeMode: (sizeMode) => set({ sizeMode }),

					toggleSizeMode: () =>
						set((state) => ({
							sizeMode: state.sizeMode === "base" ? "quote" : "base",
						})),

					setSize: (size) => set({ size }),
					setLimitPrice: (limitPrice) => set({ limitPrice }),
					setTriggerPrice: (triggerPrice) => set({ triggerPrice }),
					setScaleStart: (scaleStart) => set({ scaleStart }),
					setScaleEnd: (scaleEnd) => set({ scaleEnd }),
					setScaleLevels: (scaleLevels) => set({ scaleLevels }),
					setTwapMinutes: (twapMinutes) => set({ twapMinutes }),
					setTwapRandomize: (twapRandomize) => set({ twapRandomize }),
					setReduceOnly: (reduceOnly) => set({ reduceOnly }),
					setTpSlEnabled: (tpSlEnabled) => set({ tpSlEnabled }),
					setTpPrice: (tpPrice) => set({ tpPrice }),
					setSlPrice: (slPrice) => set({ slPrice }),
					setTif: (tif) => set({ tif }),

					resetForm: () => set({ ...DEFAULT_FORM }),

					resetPrices: () =>
						set({
							limitPrice: "",
							triggerPrice: "",
							scaleStart: "",
							scaleEnd: "",
							tpPrice: "",
							slPrice: "",
						}),
				},
			}),
			{
				name: STORAGE_KEYS.ORDER_ENTRY,
				version: 2,
				storage: createJSONStorage(() => validatedStorage),
				partialize: (state) => ({
					side: state.side,
					orderType: state.orderType,
					sizeMode: state.sizeMode,
				}),
				merge: (persisted, current) => ({
					...current,
					...DEFAULT_PERSISTED,
					...DEFAULT_FORM,
					...(persisted as Partial<PersistedState>),
				}),
			},
		),
	),
);

export const useOrderSide = () => useOrderEntryStore((s) => s.side);
export const useOrderType = () => useOrderEntryStore((s) => s.orderType);
export const useSizeMode = () => useOrderEntryStore((s) => s.sizeMode);
export const useReduceOnly = () => useOrderEntryStore((s) => s.reduceOnly);

export const useOrderSize = () => useOrderEntryStore((s) => s.size);
export const useLimitPrice = () => useOrderEntryStore((s) => s.limitPrice);
export const useTriggerPrice = () => useOrderEntryStore((s) => s.triggerPrice);

export const useScaleStart = () => useOrderEntryStore((s) => s.scaleStart);
export const useScaleEnd = () => useOrderEntryStore((s) => s.scaleEnd);
export const useScaleLevels = () => useOrderEntryStore((s) => s.scaleLevels);

export const useTwapMinutes = () => useOrderEntryStore((s) => s.twapMinutes);
export const useTwapRandomize = () => useOrderEntryStore((s) => s.twapRandomize);

export const useTpSlEnabled = () => useOrderEntryStore((s) => s.tpSlEnabled);
export const useTpPrice = () => useOrderEntryStore((s) => s.tpPrice);
export const useSlPrice = () => useOrderEntryStore((s) => s.slPrice);

export const useTif = () => useOrderEntryStore((s) => s.tif);

export const useOrderEntryActions = () => useOrderEntryStore((s) => s.actions);
