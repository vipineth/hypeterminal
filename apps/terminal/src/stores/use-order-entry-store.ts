import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";
import { STORAGE_KEYS } from "@/config/app";
import { type LimitTif, ORDER_TYPES, type OrderType } from "@/config/trade";
import { createValidatedStorage } from "@/lib/storage/validated-storage";
import { isScaleOrderType, isTriggerOrderType } from "@/lib/trade/order-types";
import type { Side, SizeMode, SizeUnit } from "@/lib/trade/types";

interface PersistedState {
	side: Side;
	orderType: OrderType;
	sizeMode: SizeMode;
}

interface FormState {
	size: string;
	sizeUnit: SizeUnit | null;
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

	setSize: (size: string, unit: SizeUnit) => void;
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
	sizeUnit: null,
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
							const wasTrigger = isTriggerOrderType(state.orderType);
							const needsTifReset = isScale && state.tif === "Ioc";
							function nextReduceOnly() {
								if (isTrigger) return true;
								if (wasTrigger) return false;
								return state.reduceOnly;
							}
							return {
								orderType,
								reduceOnly: nextReduceOnly(),
								tpSlEnabled: isTrigger ? false : state.tpSlEnabled,
								tif: needsTifReset ? "Gtc" : state.tif,
							};
						});
					},

					setSizeMode: (sizeMode) => set({ sizeMode }),

					setSize: (size, sizeUnit) => set({ size, sizeUnit }),
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

export function useOrderSide() {
	return useOrderEntryStore((s) => s.side);
}
export function useOrderType() {
	return useOrderEntryStore((s) => s.orderType);
}
export function useSizeMode() {
	return useOrderEntryStore((s) => s.sizeMode);
}
export function useReduceOnly() {
	return useOrderEntryStore((s) => s.reduceOnly);
}

export function useOrderSize() {
	return useOrderEntryStore((s) => s.size);
}
export function useOrderSizeUnit() {
	return useOrderEntryStore((s) => s.sizeUnit);
}
export function useLimitPrice() {
	return useOrderEntryStore((s) => s.limitPrice);
}
export function useTriggerPrice() {
	return useOrderEntryStore((s) => s.triggerPrice);
}

export function useScaleStart() {
	return useOrderEntryStore((s) => s.scaleStart);
}
export function useScaleEnd() {
	return useOrderEntryStore((s) => s.scaleEnd);
}
export function useScaleLevels() {
	return useOrderEntryStore((s) => s.scaleLevels);
}

export function useTwapMinutes() {
	return useOrderEntryStore((s) => s.twapMinutes);
}
export function useTwapRandomize() {
	return useOrderEntryStore((s) => s.twapRandomize);
}

export function useTpSlEnabled() {
	return useOrderEntryStore((s) => s.tpSlEnabled);
}
export function useTpPrice() {
	return useOrderEntryStore((s) => s.tpPrice);
}
export function useSlPrice() {
	return useOrderEntryStore((s) => s.slPrice);
}

export function useTif() {
	return useOrderEntryStore((s) => s.tif);
}

export function useOrderEntryActions() {
	return useOrderEntryStore((s) => s.actions);
}
