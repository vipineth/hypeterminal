import { createContext, useEffect, useRef } from "react";
import { createHyperliquidStore, type HyperliquidStore } from "./store";
import type { HyperliquidProviderProps } from "./types";

export const HyperliquidStoreContext = createContext<HyperliquidStore | null>(null);

export function HyperliquidProvider({ config, children }: HyperliquidProviderProps) {
	const storeRef = useRef<HyperliquidStore | null>(null);

	if (!storeRef.current) {
		storeRef.current = createHyperliquidStore(config);
	}

	useEffect(() => {
		storeRef.current?.getState().setConfig(config);
	}, [config]);

	return <HyperliquidStoreContext.Provider value={storeRef.current}>{children}</HyperliquidStoreContext.Provider>;
}
