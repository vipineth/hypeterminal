import type { InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { getInfoClient, getSubscriptionClient } from "@/lib/hyperliquid";

interface HyperliquidContextValue {
	infoClient: InfoClient;
	subscriptionClient: SubscriptionClient;
}

const HyperliquidContext = createContext<HyperliquidContextValue | null>(null);

interface HyperliquidProviderProps {
	children: ReactNode;
}

/**
 * Provider that gives access to Hyperliquid SDK clients.
 * Uses singleton pattern for client instances.
 */
export function HyperliquidProvider({ children }: HyperliquidProviderProps) {
	const value = useMemo<HyperliquidContextValue>(
		() => ({
			infoClient: getInfoClient(),
			subscriptionClient: getSubscriptionClient(),
		}),
		[],
	);

	return <HyperliquidContext.Provider value={value}>{children}</HyperliquidContext.Provider>;
}

/**
 * Hook to access Hyperliquid clients directly.
 * Prefer using the specific data hooks when possible.
 */
export function useHyperliquid(): HyperliquidContextValue {
	const context = useContext(HyperliquidContext);
	if (!context) {
		throw new Error("useHyperliquid must be used within a HyperliquidProvider");
	}
	return context;
}
