import { createContext, type ReactNode, use } from "react";
import { type UseMarketsInfoReturn, useMarketsInfoInternal } from "./useMarketsInfo";

const MarketsInfoContext = createContext<UseMarketsInfoReturn | null>(null);

interface MarketsInfoProviderProps {
	children: ReactNode;
}

// Singleton owner of the live market-ctx subscription. Its context value changes every
// updateInterval (5s), so it is kept separate from MarketsProvider to avoid re-rendering
// static-only consumers. It must mount inside ClientOnly + ExchangeScopeProvider because
// useMarketsInfoInternal reads useExchangeScope() and opens WebSocket subscriptions.
// Do not merge with MarketsProvider — see the note there.
export function MarketsInfoProvider({ children }: MarketsInfoProviderProps) {
	const marketsInfo = useMarketsInfoInternal({
		updateInterval: 5000,
		alwaysSubscribeAll: true,
	});

	return <MarketsInfoContext.Provider value={marketsInfo}>{children}</MarketsInfoContext.Provider>;
}

export function useMarketsInfoContext(): UseMarketsInfoReturn {
	const context = use(MarketsInfoContext);
	if (!context) {
		throw new Error("useMarketsInfoContext must be used within a MarketsInfoProvider");
	}
	return context;
}
