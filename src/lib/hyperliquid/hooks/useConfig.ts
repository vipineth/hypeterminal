import { useContext } from "react";
import { useStore } from "zustand";
import { HyperliquidStoreContext } from "../context";
import { ProviderNotFoundError } from "../errors";
import type { HyperliquidStoreState } from "../store";

export function useHyperliquidStoreApi() {
	const store = useContext(HyperliquidStoreContext);
	if (!store) {
		throw new ProviderNotFoundError();
	}
	return store;
}

export function useHyperliquidStore<T>(selector: (state: HyperliquidStoreState) => T): T {
	return useStore(useHyperliquidStoreApi(), selector);
}

export function useConfig() {
	return useHyperliquidStore((state) => state.config);
}
